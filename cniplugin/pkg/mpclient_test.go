package pkg

import "testing"

func TestParseGetPortResp(t *testing.T) {
	subnetID := "a87e0f87-a2d9-44ef-9194-9a62f178594e"
	body := `
{
  "portId":"1111111", 
  "status":"UP", 
  "macAddress":"02:42:32:43:60:bf", 
  "fixedIps":[
    {"subnetId":"a87e0f87-a2d9-44ef-9194-9a62f178594e", "ipAddress":"123.45.67.8/24"}
  ]
}
`

	port, err := parseGetPortResp(subnetID, []byte(body))
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	t.Logf("port detail: %v", port)
}
