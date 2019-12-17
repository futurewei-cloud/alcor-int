package pkg

import (
	"net"
	"reflect"
	"testing"
)

func TestParseGetPortResp(t *testing.T) {
	subnetID := "a87e0f87-a2d9-44ef-9194-9a62f178594e"

	tcs := []struct{
		desc string
		responseBody string
		expectedIP, expectedMAC, expectedStatus string
		expectingError bool
	} {
		{
			desc: "single record",
			responseBody: `
{
  "portId":"1111111",
  "status":"UP",
  "macAddress":"02:42:32:43:60:bf",
  "fixedIps":[
    {"subnetId":"----", "ipAddress":"123.45.67.8"}
  ]
}
`,			expectedIP: "123.45.67.8",
			expectedMAC: "02:42:32:43:60:bf",
			expectedStatus: "UP",
		},
		{
			desc: "multi records",
			responseBody: `
{
  "portId":"1111111",
  "status":"WIP",
  "macAddress":"00:11:22:33:44:55",
  "fixedIps":[
    {"subnetId":"11111111-1111-1111-1111-111111111111", "ipAddress":"1.1.1.1"},
    {"subnetId":"a87e0f87-a2d9-44ef-9194-9a62f178594e", "ipAddress":"2.2.2.2"}
  ]
}
`,			expectedIP: "2.2.2.2",
			expectedMAC: "00:11:22:33:44:55",
			expectedStatus: "WIP",
		},
		{
			desc: "no ip record",
			responseBody: `
{
  "portId":"1111111",
  "status":"UP",
  "macAddress":"02:42:32:43:60:bf",
  "fixedIps":[]
}
`,			expectingError: true,
		},
	}

	for _, tc := range tcs {
		info, err := parseGetPortResp(subnetID, []byte(tc.responseBody))

		if !tc.expectingError {
			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}

			if err == nil {
				if tc.expectedIP != info.IP {
					t.Errorf("%q: expected %v, got %v", tc.desc, tc.expectedIP, info.IP)
				}
				if tc.expectedMAC != info.MAC {
					t.Errorf("%q: expected %q, got %q", tc.desc, tc.expectedMAC, info.MAC)
				}
				if tc.expectedStatus != string(info.Status) {
					t.Errorf("%q: expected %q, got %q", tc.desc, tc.expectedStatus, info.Status)
				}
			}
		}

		if tc.expectingError {
			if err == nil {
				t.Errorf("%q: expected error; got nil", tc.desc)
			} else {
				t.Logf("%q: expected error; got %v", tc.desc, err)
			}
		}
	}
}

func TestParseSubnetInfo(t *testing.T) {
	body := `{
  "gatewayIp": "10.0.0.1",
  "cidr": "10.0.0.0/24"
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
