package pkg

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strings"

	"github.com/go-resty/resty/v2"
)

func (m client) Create(projectID, subnetID, portID, targetHost, targetNIC, targetNS, cniSandbox string) error {
	body, err := genCreatePortBody(projectID, subnetID, portID, targetHost, targetNIC, targetNS, cniSandbox)
	if err != nil {
		return err
	}

	url := *m.url
	url.Path = path.Join(url.Path, "project", projectID, "ports")
	client := resty.New().R().SetHeader("Content-Type", "application/json")
	resp, err := client.SetBody(body).Post(url.String())
	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusCreated {
		return fmt.Errorf("failed, method=POST, url=%s, status cod=%d, body=%s", m.url.String(), resp.StatusCode(), resp)
	}

	return nil
}

func (m client) Get(projectID, subnetID, portID string) (*Port, error) {
	url := *m.url
	url.Path = path.Join(url.Path, "project", projectID, "ports", portID)
	resp, err := resty.New().R().Get(url.String())
	if err != nil {
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		return nil, fmt.Errorf("failed, method=GT, url=%s, status cod=%d, body=%s", m.url.String(), resp.StatusCode(), resp)
	}

	return parseGetPortResp(subnetID, resp.Body())
}

func (m client) Delete(projectID, portID string) error {
	url := *m.url
	url.Path = path.Join(url.Path, "project", projectID, "ports", portID)
	resp, err := resty.New().R().Delete(url.String())
	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusNoContent {
		return fmt.Errorf("failed, method=DELETE, url=%s, status cod=%d", m.url.String(), resp.StatusCode())
	}

	return nil
}

func parseGetPortResp(subnetID string, body []byte) (*Port, error) {
	var obj map[string]*json.RawMessage
	if err := json.Unmarshal(body, &obj); err != nil {
		return nil, fmt.Errorf("failed, not json body: %s", string(body))
	}

	if _, ok := obj["port"]; !ok {
		return nil, fmt.Errorf("failed, could not find port key: %s", string(body))
	}

	return parsePortDetail(subnetID, []byte(*obj["port"]))
}

func parsePortDetail(subnetID string, body []byte) (*Port, error) {
	const KeyFixedIPs = "fixed_ips"
	const KeyMacAddress = "mac_address"
	const KeyStatus = "status"

	var obj map[string]*json.RawMessage
	if err := json.Unmarshal(body, &obj); err != nil {
		return nil, fmt.Errorf("failed, port detail is not json body: %s", string(body))
	}

	fixedIPs, ok := obj[KeyFixedIPs]
	if !ok {
		return nil, fmt.Errorf("failed, could not find fixed_ips: %s", string(body))
	}

	ip, err := parsePortFixedIPs(subnetID, []byte(*fixedIPs))
	if err != nil {
		return nil, err
	}

	return &Port{
		Status: PortStatus(strings.Trim(string(*obj[KeyStatus]), `"`)),
		MAC:    strings.Trim(string(*obj[KeyMacAddress]), `"`),
		IP:     ip,
	}, nil
}

func parsePortFixedIPs(subnetID string, body []byte) (string, error) {
	const KeyIPAddress = "ip_address"
	const KeySubnetID = "subnet_id"

	var fixedIps []map[string]string
	if err := json.Unmarshal(body, &fixedIps); err != nil {
		return "", fmt.Errorf("failed, fixed_ips field is malformated: %s", string(body))
	}

	if len(fixedIps) == 0 {
		return "", fmt.Errorf("failed, no ip address")
	}

	ip := fixedIps[0][KeyIPAddress]
	if len(fixedIps) > 1 {
		for _, kv := range fixedIps {
			if currSubnetID, ok := kv[KeySubnetID]; ok {
				if currSubnetID == subnetID {
					ip = kv[KeyIPAddress]
				}
			}
		}
	}

	return ip, nil
}

func genCreatePortBody(projectID, subnetID, portID, targetHost, targetNIC, targetNS, cniSandbox string) (string, error) {
	const bodyTemplate = `
{
  "port": {
    "project_id": "%s",
    "id": "%s",
    "name": "%s",
    "admin_state_up": true,
    "description": "%s",
    "network_id": "%s",
    "veth_name": "%s",
    "veth_namespace": "%s",
    "dns_domain": "my-domain.org.",
    "dns_name": "myport",
    "port_security_enabled": false,
    "binding:host_id": "%s"
  }
}
`
	if len(projectID) == 0 ||
		len(subnetID) == 0 ||
		len(portID) == 0 ||
		len(targetHost) == 0 ||
		len(targetNS) == 0 ||
		len(targetNIC) == 0 ||
		len(cniSandbox) == 0 {
		return "", fmt.Errorf("invalid input: empty value not allowed")
	}

	desc := fmt.Sprintf("cni %s, ns:%s, host:%s", cniSandbox, targetNS, targetHost)
	body := fmt.Sprintf(bodyTemplate,
		projectID,
		portID,
		"k8s_"+portID,
		desc,
		subnetID,
		targetNIC,
		targetNS,
		targetHost)

	return body, nil
}
