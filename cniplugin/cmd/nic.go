/*
Copyright 2019 The Alcor Authors.
Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
*/
package main

import (
	"fmt"
	"net"
	"time"

	"github.com/containernetworking/cni/pkg/types/current"
	"github.com/futurewei-cloud/mizar-mp/cniplugin/pkg"
)

func nicProvision(client pkg.PortClient, projectID, subnetID, portID, targetHost, cniSandbox, cniNS, nic string, timeout, interval time.Duration) (mac, ip string, err error) {
	if err := client.Create(projectID, subnetID, portID, targetHost, nic, cniNS, cniSandbox); err != nil {
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
