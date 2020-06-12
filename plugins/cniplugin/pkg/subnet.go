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
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"net"
	"net/http"
	"path"
)

// subnet is struct to facilitate json parsing
type subnet struct {
	Subnet struct {
		GatewayIP string `json:"gateway_ip"`
		CIDR string `json:"cidr"`
	} `json: "subnet"`
}

func parseSubnetInfo(data []byte) (*Subnet, error) {
	subnet := &subnet{}
	if err := json.Unmarshal(data, subnet); err != nil {
		return nil, err
	}

	gwip := net.ParseIP(subnet.Subnet.GatewayIP)
	_, netmask, err := net.ParseCIDR(subnet.Subnet.CIDR)
	if err != nil {
		return nil, err
	}

	return &Subnet{Gateway: gwip, Netmask: netmask.Mask}, nil
}

func (m client) GetSubnet(projectID, subnetID string) (*Subnet, error) {
	url := *m.url
	url.Path = path.Join(url.Path, "project", projectID, "subnets", subnetID)
	resp, err := resty.New().R().Get(url.String())
	if err != nil {
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		return nil, fmt.Errorf("failed, method=GET, url=%s, status cod=%d", m.url.String(), resp.StatusCode())
	}

	return parseSubnetInfo(resp.Body())
}

