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
	"errors"
	"fmt"
	"net"
	"time"

	"github.com/containernetworking/cni/pkg/skel"
	"github.com/containernetworking/cni/pkg/version"
	"github.com/futurewei-cloud/mizar-mp/cniplugin/pkg"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

const (
	pollTimeout  = time.Second * 15
	pollInterval = time.Second * 1
)

func cmdAdd(args *skel.CmdArgs) error {
	nic := args.IfName
	cniNS := args.Netns
	sandbox := args.ContainerID

	startedToCreatePort := false
	hasPersistedPortID := false
	var err error

	store := pkg.NewPortIDStore()
	portID, e := store.Get(sandbox, nic)
	if e != nil || portID == "" {
		portID = uuid.New().String()

		// store port id in persistent storage which survives process exits
		err = store.Record(portID, sandbox, nic)
		if err != nil {
			log.Errorf("add op failed; cannot write port id in store: %v", err)
			return fmt.Errorf("add op failed; cannot write port id in store: %v", err)
		}
	}

	hasPersistedPortID = true

	netConf, err := loadNetConf(args.StdinData)
	if err != nil {
		log.Errorf("add op failed; net conf not well formatted: %v", err)
		return fmt.Errorf("add op failed; net conf not well formatted: %v", err)
	}

	projectID := netConf.ProjectID
	if len(projectID) == 0 {
		log.Errorf("invalid net conf file - no project ID")
		return fmt.Errorf("invalid net conf file - no project ID")
	}
	subnetID := netConf.SubnetID
	if len(subnetID) == 0 {
		log.Errorf("invalid net conf file - no subnet ID")
		return fmt.Errorf("invalid net conf file - no subnet ID")
	}
	hostID := netConf.HostID
	if len(hostID) == 0 {
		log.Errorf("invalid net conf file - no host ID")
		return fmt.Errorf("invalid net conf file - no host ID")
	}

	client, err := pkg.New(netConf.MizarMPServiceURL)
	if err != nil {
		log.Errorf("add op failed; unable to get rest api client: %v", err)
		return fmt.Errorf("add op failed; unable to get rest api client: %v", err)
	}

	defer func() {
		if err == nil {
			return // no error, no roll back.
		}

		// to recover in case of partial failure
		log.Errorf("Add op failed: %v", err)
		log.Warningf("starting applicable recovery process...")

		if startedToCreatePort {
			if e := client.Delete(projectID, portID); e != nil {
				log.Warningf("recovery of port deletion had error: %v", e)
			}
		}

		if hasPersistedPortID {
			if e := store.Delete(sandbox, nic); e != nil {
				log.Warningf("recovery of port ID removal from store had error: %v", e)
			}
		}
	}()

	startedToCreatePort = true
	mac, ip, err := nicProvision(client, projectID, subnetID, portID, hostID, sandbox, cniNS, nic, pollTimeout, pollInterval)
	if err != nil {
		return fmt.Errorf("add op failed; cannot provision project %s port %q properly: %v", projectID, portID, err)
	}

	nicIP := net.ParseIP(ip)
	if nicIP == nil {
		log.Errorf("add op failed; invalid ip address %q", ip)
		return fmt.Errorf("add op failed; invalid ip address %q", ip)
	}

	err = pkg.FindNicInNs(nic, cniNS)
	if err != nil {
		log.Errorf("add op failed; could not find interface %s in netns %s: %v", nic, cniNS, err)
		return fmt.Errorf("add op failed; could not find interface %s in netns %s: %v", nic, cniNS, err)
	}

	subnet, err := client.GetSubnet(projectID, subnetID)
	if err != nil {
		log.Errorf("add op failed; unable to get subnet info: %v", err)
		return fmt.Errorf("add op failed; unable to get subnet info: %v", err)
	}

	r, err := nicGetCNIResult(sandbox, nic, mac, nicIP, subnet.Gateway, subnet.Netmask)
	if err != nil {
		log.Errorf("add op failed; unable to collect network device info: %v", err)
		return fmt.Errorf("add op failed; unable to collect network device info: %v", err)
	}

	versionedResult, err := r.GetAsVersion(netConf.CNIVersion)
	if err != nil {
		log.Errorf("failed to get versioned result: %v", err)
		return fmt.Errorf("failed to get versioned result: %v", err)
	}

	return versionedResult.Print()
}

func cmdCheck(args *skel.CmdArgs) error {
	return errors.New("not implemented")
}

func cmdDel(args *skel.CmdArgs) error {
	store := pkg.NewPortIDStore()
	portID, err := store.Get(args.ContainerID, args.IfName)
	if err != nil {
		log.Warningf("find no port id in store for sandbox %s dev %s: %v", args.ContainerID, args.IfName, err)
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
