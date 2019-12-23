package main

import (
	"net"
	"reflect"
	"testing"

	"github.com/futurewei-cloud/mizar-mp/cniplugin/pkg"
	"github.com/stretchr/testify/mock"
)

func TestNICGetCNIResult(t *testing.T) {
	sandbox := "sabdbox123"
	nic := "eth0"
	mac := "00:11:22:33:44:55"
	ip := net.ParseIP("172.17.8.9")
	gw := net.ParseIP("172.17.8.2")
	netmask := net.IPv4Mask(255, 255, 255, 0)

	r, err := nicGetCNIResult(sandbox, nic, mac, ip, gw, netmask)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	t.Logf("result detail: %v", *r)

	if len(r.Interfaces) != 1 {
		t.Errorf("expected 1 intterface; got %d", len(r.Interfaces))
	}

	if r.Interfaces[0].Name != nic {
		t.Errorf("expected %q, got %q", nic, r.Interfaces[0].Name)
	}

	if r.Interfaces[0].Mac != mac {
		t.Errorf("expected %q, got %q", mac, r.Interfaces[0].Mac)
	}

	if r.Interfaces[0].Sandbox != sandbox {
		t.Errorf("expected %q, got %q", sandbox, r.Interfaces[0].Mac)
	}

	if len(r.IPs) != 1 {
		t.Errorf("expected 1 ip; got %d", len(r.IPs))
	}

	if 0 != *r.IPs[0].Interface {
		t.Errorf("expected 0, got %d", *r.IPs[0].Interface)
	}

	if !reflect.DeepEqual(r.IPs[0].Address.IP, ip) {
		t.Errorf("expected %v, got %v", ip, r.IPs[0].Address.IP)
	}

	if !reflect.DeepEqual(r.IPs[0].Address.Mask, netmask) {
		t.Errorf("expected %v, got %v", netmask, r.IPs[0].Address.Mask)
	}

	if !reflect.DeepEqual(r.IPs[0].Gateway, gw) {
		t.Errorf("expected %v, got %v", gw, r.IPs[0].Gateway)
	}
}

type mockedClient struct {
	mock.Mock
}

func (m *mockedClient) Create(projectID, subnetID, portID, targetHost, targetNIC, targetNS, cniSandbox string) error {
	args := m.Called(projectID, subnetID, portID, targetHost, targetNIC, targetNS, cniSandbox)
	return args.Error(0)
}

func (m *mockedClient) Get(projectID, subnetID, portID string) (*pkg.Port, error) {
	args := m.Called(projectID, subnetID, portID)
	return args.Get(0).(*pkg.Port), args.Error(1)
}

func (m *mockedClient) Delete(projectID, portID string) error {
	args := m.Called(projectID, portID)
	return args.Error(0)
}

func (m *mockedClient) GetSubnet(projectID, subnetID string) (*pkg.Subnet, error) {
	args := m.Called(projectID, subnetID)
	return args.Get(0).(*pkg.Subnet), args.Error(1)
}

func TestNICProvision(t *testing.T) {
	projectID := "myproject"
	subnetID := "mysubnet"
	portID := "myport"
	targetHost := "mine"
	cniNS := "/run/netns/x"
	nic := "eth0"
	sandbox := "cnicontainer"

	fakePort := pkg.Port{
		Status: "UP",
		MAC:    "mymac",
		IP:     "4.3.2.1",
	}

	client := &mockedClient{}
	client.On("Create", projectID, subnetID, portID, targetHost, nic, cniNS, sandbox).Return(nil)
	client.On("Get", projectID, subnetID, portID).Return(&fakePort, nil)

	mac, ip, err := nicProvision(client, projectID, subnetID, portID, targetHost, sandbox, cniNS, nic, 0, 0)

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	t.Logf("mac: %v, ip: %v", mac, ip)
	if mac != "mymac" {
		t.Errorf("expected mymac, got %q", mac)
	}

	if "4.3.2.1" != ip {
		t.Errorf("expected 4.3.2.1, got %q", ip)
	}

	client.AssertExpectations(t)
}
