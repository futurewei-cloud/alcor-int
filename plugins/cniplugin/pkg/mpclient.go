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
package pkg

import (
	"net"
	"net/url"
)

// PortStatus represents port status
type PortStatus string

const (
	// PortStatusUP is the only status we care about, UP
	PortStatusUP PortStatus = "UP"
)

// Port is the interesting information of mizar-mp port
type Port struct {
	Status PortStatus
	MAC    string
	IP     string // not in CIDR format; mere ip address like "10.0.0.4"
}

//Subnet is the subnet info in Mizar-MP
type Subnet struct {
	Gateway net.IP
	Netmask net.IPMask
}

// PortClient is the interface to request Mizar-MP to work at ports
type PortClient interface {
	Create(projectID, subnetID, portID, targetHost, targetNIC, targetNS, cniSandbox string) error
	Get(projectID, subnetID, portID string) (*Port, error)
	Delete(projectID, portID string) error
	GetSubnet(projectID, subnetID string) (*Subnet, error)
}

type client struct {
	mpURL string
	url   *url.URL
}

// New creates PortClient which is used to request Mizar-MP port service
func New(mpURL string) (PortClient, error) {
	url, err := url.Parse(mpURL)
	if err != nil {
		return nil, err
	}

	return &client{
		mpURL: mpURL,
		url:   url,
	}, nil
}
