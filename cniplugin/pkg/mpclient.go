package pkg

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"

	"github.com/go-resty/resty/v2"
)

type PortStatus string

const (
	// the only status we care about here
	PortStatusUP PortStatus = "UP"
)

const (
	defaultProjectID = "3dda2801-d675-4688-a63f-dcda8d327f50"
	defaultSubnetID  = "a87e0f87-a2d9-44ef-9194-9a62f178594e"
)

// Port is the interesting information of port
type Port struct {
	Status PortStatus
	MAC    string
	IP     string
}

// PortClient is the interface to request Mizar-MP to work at ports
type PortClient interface {
	Create(projectID, portID, targetNIC, targetNS string) error
	Get(prohectID, subnetID, portID string) (*Port, error)
	Delete(projectID, portID string) error
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

// todo: may split into 2 REST calls: create port + bind host/ns
func (m client) Create(projectID, portID, targetNIC, targetNS string) error {
	body, err := genCreatePortBody(portID, targetNIC, targetNS)
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

func genCreatePortBody(portID, targetNIC, targetNS string) (string, error) {
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
	hostname, err := os.Hostname()
	if err != nil {
		return "", err
	}
	hostBaseName := strings.Split(hostname, ".")[0]

	body := fmt.Sprintf(bodyTemplate,
		defaultProjectID,
		portID,
		"k8s_"+portID,
		defaultSubnetID,
		targetNIC,
		targetNS,
		hostBaseName)

	return body, nil
}
