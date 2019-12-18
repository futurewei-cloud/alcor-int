package main

import (
	"net"
	"reflect"
	"testing"
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
