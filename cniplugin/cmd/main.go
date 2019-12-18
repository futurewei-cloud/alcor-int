package main

import (
	"errors"
	"fmt"
	"net"
	"time"

	"github.com/containernetworking/cni/pkg/skel"
	"github.com/containernetworking/cni/pkg/types/current"
	"github.com/containernetworking/cni/pkg/version"
	"github.com/futurewei-cloud/mizar-mp/cniplugin/pkg"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

const (
	pollTimeout = time.Second * 15
	pollInterval = time.Second * 1
)

func cmdAdd(args *skel.CmdArgs) error {
	nic := args.IfName
	cniNS := args.Netns

	startCreatePort := false
	startPersistPortID := false
	var err error

	store := pkg.NewPortIDStore()
	portId, e := store.Get(args.ContainerID, nic)
	if e != nil || portId == "" {
		portId = uuid.New().String()

		// store port id in persistent storage which survives process exits
		startPersistPortID = true
		err = store.Record(portId, args.ContainerID, nic)
		if err != nil {
			return fmt.Errorf("add op failed; cannot write port id in store: %v", err)
		}
	}

	netConf, err := loadNetConf(args.StdinData)
	if err != nil {
		return fmt.Errorf("add op failed; net conf not well formatted: %v", err)
	}

	client, err := pkg.New(netConf.MizarMPServiceURL)
	if err != nil {
		return fmt.Errorf("add op failed; unable to get rest api client: %v", err)
	}

	defer func() {
		if err == nil {
			return	// no error, no roll back.
		}

		// to recover in case of partial failure
		log.Errorf("Add op failed: %v", err)
		log.Warningf("starting applicable recovery process...")

		if startCreatePort {
			if e := client.Delete(netConf.ProjectID, portId); e != nil {
				log.Warningf("recovery of port deletion had error: %v", e)
			}
		}

		if startPersistPortID {
			if e := store.Delete(args.ContainerID, nic); e != nil {
				log.Warningf("recovery of port ID removal from persistent store had error: %v", e)
			}
		}
	}()

	startCreatePort = true
	mac, ip, err := provisionNIC(client, netConf.ProjectID, netConf.SubnetID, args.ContainerID, netConf.HostID, cniNS, nic, portId)
	if err != nil {
		return fmt.Errorf("add op failed; cannot provision project %s port %q properly: %v", netConf.ProjectID, portId, err)
	}

	err = pkg.FindNicInNs(nic, cniNS)
	if err != nil {
		return fmt.Errorf("add op failed; could not find interface %s in netns %s: %v", nic, cniNS, err)
	}

	subnet, err := client.GetSubnet(netConf.ProjectID, netConf.SubnetID)
	if err != nil {
		return fmt.Errorf("add op failed; unable to get subnet info: %v", err)
	}

	gw := subnet.Gateway
	r, err := collectResult(args.ContainerID, nic, mac, ip, gw, subnet.Netmask)
	if err != nil {
		return fmt.Errorf("add op failed; unable to collect network device info: %v", err)
	}

	versionedResult, err := r.GetAsVersion(netConf.CNIVersion)
	if err != nil {
		return fmt.Errorf("failed to get versioned result: %v", err)
	}

	return versionedResult.Print()
}

func provisionNIC(client pkg.PortClient, projectID, subnetID, sandbox, targetHost, cniNS, nic, portId string) (mac, ip string, err error) {
	if err := client.Create(projectID, subnetID, portId, targetHost, nic, cniNS); err != nil {
		return "", "", err
	}

	// polling till port is up; get mac address & ip address
	deadline := time.Now().Add(pollTimeout)
	for {
		info, err := client.Get(projectID, subnetID, portId)
		if err != nil {
			return "", "", err
		}

		if info.Status == pkg.PortStatusUP {
			mac = info.MAC
			ip = info.IP
			return mac, ip, nil
		}

		if time.Now().After(deadline) {
			return "", "", fmt.Errorf("timed out: port %q not ready", portId)
		}

		time.Sleep(pollInterval)
	}

	return "", "", fmt.Errorf("unexpected error, no port info")
}

func collectResult(sandbox, nic, mac, ip string, gw net.IP, netmask net.IPMask) (*current.Result, error){
	var r current.Result
	intf := &current.Interface{Name: nic, Mac: mac, Sandbox: sandbox}
	i := 0
	r.Interfaces = append(r.Interfaces, intf)

	ipv4Net := net.IPNet{
		IP:   net.ParseIP(ip),
		Mask: netmask,
	}

	ipInfo := &current.IPConfig{
		Version:   "4",
		Interface: &i,
		Address:   ipv4Net,
		Gateway:   gw,
	}

	r.IPs = append(r.IPs, ipInfo)
	return &r, nil
}

func cmdCheck(args *skel.CmdArgs) error {
	return errors.New("not implemented")
}

func cmdDel(args *skel.CmdArgs) error {
	store := pkg.NewPortIDStore()
	portID, err := store.Get(args.ContainerID, args.IfName)
	if err != nil {
		log.Warningf("fine for no record in store for sandbox %s dev %s: %v", args.ContainerID, args.IfName, err)
		return nil
	}

	netConf, err := loadNetConf(args.StdinData)
	if err != nil {
		log.Errorf("Del op failed with net config file parsing: %v", err)
		return fmt.Errorf("del op failed; net config file in bad format: %v", err)
	}

	client, err := pkg.New(netConf.MizarMPServiceURL)
	if err != nil {
		log.Errorf("Del op failed to get Mizar-MP client: %v", err)
		return fmt.Errorf("del op failed; unable to get rest api client: %v", err)
	}

	if err := client.Delete(netConf.ProjectID, portID); err != nil {
		log.Errorf("Del op failed to delete port: %v", err)
		return err
	}

	if e := store.Delete(args.ContainerID, args.IfName); e != nil {
		log.Warningf("had error cleaning up persistent port ID: %v", e)
	}

	return nil
}

func main() {
	supportVersions := version.PluginSupports("0.1.0", "0.2.0", "0.3.0", "0.3.1")
	skel.PluginMain(cmdAdd, cmdCheck, cmdDel, supportVersions, "mizarmp")
}
