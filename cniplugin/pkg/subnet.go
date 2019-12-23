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
	url.Path = path.Join(url.Path, "project", projectID, "subnet", subnetID)
	resp, err := resty.New().R().Get(url.String())
	if err != nil {
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		return nil, fmt.Errorf("failed, method=GET, url=%s, status cod=%d", m.url.String(), resp.StatusCode())
	}

	return parseSubnetInfo(resp.Body())
}

