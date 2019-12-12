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
	Create(portID, targetNIC, targetNS string) error
	Get(portID string) (*Port, error)
	Delete(portID string) error
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

func (m client) Create(portID, targetNIC, targetNS string) error {
	body, err := genCreatePortBody(portID, targetNIC, targetNS)
	if err != nil {
		return err
	}

	url := path.Join(m.url.Path, "Port")
	client := resty.New().R().SetHeader("Content-Type", "application/json")
	resp, err := client.SetBody(body).Post(url)
	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusOK {
		return fmt.Errorf("failed, status cod=%d, body=%s", resp.StatusCode(), resp)
	}

	return nil
}

func (m client) Get(portID string) (*Port, error) {
	url := path.Join(m.url.Path, "Port", portID)
	resp, err := resty.New().R().Get(url)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode() != http.StatusOK {
		return nil, fmt.Errorf("failed, status cod=%d, body=%s", resp.StatusCode(), resp)
	}

	return parseGetPortResp(resp.Body())
}

func (m client) Delete(portID string) error {
	url := path.Join(m.url.Path, "Port", portID)
	resp, err := resty.New().R().Delete(url)
	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusOK {
		return fmt.Errorf("failed, status cod=%d, body=%s", resp.StatusCode(), resp)
	}

	return nil
}

func parseGetPortResp(body []byte) (*Port, error) {
	var obj map[string]*json.RawMessage
	if err := json.Unmarshal(body, &obj); err != nil {
		return nil, fmt.Errorf("failed, not json body: %s", string(body))
	}

	var fixedIps []map[string]string
	if err := json.Unmarshal([]byte(*obj["fixedIps"]), &fixedIps); err != nil {
		return nil, fmt.Errorf("failed, fixedIps field malformatted: %s", string(*obj["fixedIps"]))
	}

	return &Port{
		Status: PortStatus(*obj["status"]),
		MAC:    string(*obj["macAddress"]),
		IP:     fixedIps[0]["ipAddress"],
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
  "host" : "%s"
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
