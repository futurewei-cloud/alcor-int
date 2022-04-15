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
