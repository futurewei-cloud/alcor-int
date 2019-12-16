package main

import (
	"errors"
	"fmt"
	"github.com/containernetworking/cni/pkg/skel"
	"github.com/containernetworking/cni/pkg/types/current"
	"github.com/containernetworking/cni/pkg/version"
	"github.com/futurewei-cloud/mizar-mp/cniplugin/pkg"
	"github.com/google/uuid"
	"net"
	"time"
)

const (
	pollTimeout = time.Second * 60
	pollInterval = time.Second * 1
)

func cmdAdd(args *skel.CmdArgs) error {
	nic := args.IfName
	cniNS := args.Netns
	portId := uuid.New().String()
	store := pkg.NewPortIDStore()

	portCreated := false
	portIDPersisted := false
	var err error

	netConf, err := loadNetConf(args.StdinData)
	if err != nil {
		return err
	}

	client, err := pkg.New(netConf.MizarMPServiceURL)
	if err != nil {
		return err
	}

	defer func() {
		if err == nil {
			return	// no error, no roll back.
		}

		// to recover in case of failure

		if portCreated {
			if e := client.Delete(portId); e != nil {
					// todo: log error
			}
		}

		if portIDPersisted {
			if e := store.Delete(args.ContainerID, nic); e != nil {
				// todo: log error
			}
		}
	}()


	mac, ip, err := provisionNIC(client, args.ContainerID, cniNS, nic, portId)
	portCreated = true
	if err != nil {
		return err
	}

	// todo: verify nic in ns properly provisioned

	gw, _, err := pkg.GetV4Gateway(nic, cniNS)

	// store port id in persistent storage which survives process exit
	err = store.Record(portId, args.ContainerID, nic)
	portIDPersisted = true
	if err != nil {
		return err
	}

	r, err := collectResult(args.ContainerID, nic, mac, ip, *gw)
	if err != nil {
		return err
	}

	versionedResult, err := r.GetAsVersion(netConf.CNIVersion)
	if err != nil {
		return fmt.Errorf("failed to get versioned result: %v", err)
	}

	return versionedResult.Print()
}

func provisionNIC(client pkg.PortClient, sandbox, cniNS, nic, portId string) (mac, ip string, err error) {
	if err := client.Create(portId, nic, cniNS); err != nil {
		return "", "", err
	}

	// polling till port is up; get mac address & ip address
	deadline := time.Now().Add(pollTimeout)
	for {
		info, err := client.Get(portId)
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

func collectResult(sandbox, nic, mac, ip string, gw net.IP) (*current.Result, error){
	var r current.Result
	intf := &current.Interface{Name: nic, Mac: mac, Sandbox: sandbox}
	i := 0
	r.Interfaces = append(r.Interfaces, intf)
	ipData, ipNet, err := net.ParseCIDR(ip)
	if err != nil {
		return nil, err
	}

	ipv4Net := net.IPNet{
		IP:   ipData,
		Mask: ipNet.Mask,
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
		return err
	}

	netConf, err := loadNetConf(args.StdinData)
	if err != nil {
		return err
	}
	client, err := pkg.New(netConf.MizarMPServiceURL)
	if err != nil {
		return err
	}

	if err := client.Delete(portID); err != nil {
		return err
	}

	store.Delete(args.ContainerID, args.IfName)
	return nil
}

func main() {
	supportVersions := version.PluginSupports("0.1.0", "0.2.0", "0.3.0", "0.3.1")
	skel.PluginMain(cmdAdd, cmdCheck, cmdDel, supportVersions, "mizarmp")
}

