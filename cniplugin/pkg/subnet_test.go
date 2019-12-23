package pkg

import (
	"net"
	"reflect"
	"testing"
)

func TestParseSubnetInfo(t *testing.T) {
	body := `{
  "subnet": {
    "cidr": "10.0.0.0/24",
    "gateway_ip": "10.0.0.1"
  }
}`
	subnet, err := parseSubnetInfo([]byte(body))
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	t.Logf("subnet detail: %v", subnet)

	if !reflect.DeepEqual(subnet.Netmask, net.IPv4Mask(255, 255, 255, 0)) {
		t.Errorf("expected /24, got %v", subnet.Netmask)
	}
	if !reflect.DeepEqual(subnet.Gateway, net.ParseIP("10.0.0.1")) {
		t.Errorf("expected 10.0.0.1, got %v", subnet.Gateway)
	}
}
