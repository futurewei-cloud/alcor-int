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

func cmdAdd(args *skel.CmdArgs) error {
	nic := args.IfName
	cniNS := args.Netns
	portId := uuid.New().String()

	// request to create the port
	netConf, err := loadNetConf(args.StdinData)
	if err != nil {
		return err
	}

	client, err := pkg.New(netConf.MizarMPServiceURL)
	if err != nil {
		return err
	}

	if err := client.Create(portId, nic, args.ContainerID); err != nil {
		return err
	}

	// polling till port is up; get mac address & ip address
	deadline := time.Now().Add(time.Second * 60)
	var mac, ip string
	for {
		info, err := client.Get(portId)
		if err != nil {
			return err
		}
		if info.Status == pkg.PortStatusUP {
			mac = info.MAC
			ip = info.IP
			break
		}

		if time.Now().After(deadline) {
			return fmt.Errorf("timed out: port %q not ready", portId)
		}
	}

	// todo: verify nic in ns properly provisioned

	gw, _, err := pkg.GetV4Gateway(nic, cniNS)

	// store port id in persistent storage which survives process exit
	if err := pkg.NewPortIDStore().Record(portId, args.ContainerID, nic); err != nil {
		return err
	}

	var r current.Result
	intf := &current.Interface{Name: nic, Mac: mac, Sandbox: args.ContainerID}
	i := 0
	r.Interfaces = append(r.Interfaces, intf)
	ipData, ipNet, err := net.ParseCIDR(ip)
	if err != nil {
		return err
	}

	ipv4Net := net.IPNet{
		IP: ipData,
		Mask: ipNet.Mask,
	}

	ipInfo := &current.IPConfig{
		Version: "4",
		Interface: &i,
		Address: ipv4Net,
		Gateway: *gw,
	}

	r.IPs = append(r.IPs, ipInfo)

	versionedResult, err := r.GetAsVersion(netConf.CNIVersion)
	if err != nil {
		return fmt.Errorf("failed to get versioned result: %v", err)
	}

	return versionedResult.Print()
}

func cmdCheck(args *skel.CmdArgs) error {
	return errors.New("not implemented")
}

func cmdDel(args *skel.CmdArgs) error {
	return errors.New("to impl")

	// retrieve port-id based on ns + nic
	// request to delete port
	// if ok, clean up the persistent record of port-id
}

func main() {
	supportVersions := version.PluginSupports("0.1.0", "0.2.0", "0.3.0", "0.3.1")
	skel.PluginMain(cmdAdd, cmdCheck, cmdDel, supportVersions, "mizarmp")
}
