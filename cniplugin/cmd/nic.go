package main

import (
	"fmt"
	"net"
	"time"

	"github.com/containernetworking/cni/pkg/types/current"
	"github.com/futurewei-cloud/mizar-mp/cniplugin/pkg"
)

func nicProvision(client pkg.PortClient, projectID, subnetID, portID, targetHost, cniNS, nic string, timeout, interval time.Duration) (mac, ip string, err error) {
	if err := client.Create(projectID, subnetID, portID, targetHost, nic, cniNS); err != nil {
		return "", "", err
	}

	// polling till port is up; get mac address & ip address
	deadline := time.Now().Add(timeout)
	for {
		info, err := client.Get(projectID, subnetID, portID)
		if err != nil {
			return "", "", err
		}

		if info.Status == pkg.PortStatusUP {
			mac = info.MAC
			ip = info.IP
			return mac, ip, nil
		}

		if time.Now().After(deadline) {
			return "", "", fmt.Errorf("timed out: port %q not ready", portID)
		}

		time.Sleep(interval)
	}
}

func nicGetCNIResult(sandbox, nic, mac string, ip, gw net.IP, netmask net.IPMask) (*current.Result, error) {
	var r current.Result
	intf := &current.Interface{Name: nic, Mac: mac, Sandbox: sandbox}
	i := 0
	r.Interfaces = append(r.Interfaces, intf)

	ipv4Net := net.IPNet{
		IP:   ip,
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
