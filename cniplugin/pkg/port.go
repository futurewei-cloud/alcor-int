package pkg

import (
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"net/http"
	"path"
	"strings"
)

// todo: may split into 2 REST calls: create port + bind host/ns
func (m client) Create(projectID, subnetID, portID, targetHost, targetNIC, targetNS string) error {
	body, err := genCreatePortBody(projectID, subnetID, portID, targetHost, targetNIC, targetNS)
	if err != nil {
		return err
	}

	url := *m.url
	url.Path = path.Join(url.Path, "project", projectID, "port")
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
	url.Path = path.Join(url.Path, "project", projectID, "port", portID)
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
	url.Path = path.Join(url.Path, "project", projectID, "port", portID)
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

	var fixedIps []map[string]string
	if err := json.Unmarshal([]byte(*obj["fixedIps"]), &fixedIps); err != nil {
		return nil, fmt.Errorf("failed, fixedIps field malformatted: %s", string(*obj["fixedIps"]))
	}

	if len(fixedIps) == 0 {
		return nil, fmt.Errorf("failed, no ip address")
	}

	ip := fixedIps[0]["ipAddress"]
	if len(fixedIps) > 1 {
		for _, kv := range fixedIps {
			if kv["subnetId"] == subnetID {
				ip = kv["ipAddress"]
			}
		}
	}

	return &Port{
		Status: PortStatus(strings.Trim(string(*obj["status"]), `"`)),
		MAC:    strings.Trim(string(*obj["macAddress"]), `"`),
		IP:     ip,
	}, nil
}

func genCreatePortBody(projectID, subnetID, portID, targetHost, targetNIC, targetNS string) (string, error) {
	const bodyTemplate = `
{
  "projectId": "%s",
  "id": "%s",
  "name": "%s",
  "networkId": "%s",
  "vethName": "%s",
  "namespace": "%s",
  "hostId" : "%s"
}
`
	body := fmt.Sprintf(bodyTemplate,
		projectID,
		portID,
		"k8s_"+portID,
		subnetID,
		targetNIC,
		targetNS,
		targetHost)

	return body, nil
}
