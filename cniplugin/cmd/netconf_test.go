package main

import "testing"

func TestLoadNetConf(t *testing.T) {
	testData := []byte(`
{
  "cniVersion": "0.3.1",
  "name": "mizarmp-default",
  "type": "mizarmp",
  "mpurl": "http://127.0.0.1",
  "subnet": "a87e0f87-a2d9-44ef-9194-9a62f178594e",
  "project": "3dda2801-d675-4688-a63f-dcda8d327f50",
  "hostId": "localhost"
}
`)

	netConf, err := loadNetConf(testData)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	t.Logf("netConf: %v", netConf)

	if netConf.HostID != "localhost" {
		t.Errorf("host id: expected localhost, got %q", netConf.HostID)
	}

	if netConf.MizarMPServiceURL != "http://127.0.0.1" {
		t.Errorf("mizar-mp service URL: expected http://127.0.0.1, got %q", netConf.MizarMPServiceURL)
	}
}
