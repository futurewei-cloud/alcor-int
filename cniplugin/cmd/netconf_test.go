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
package main

import "testing"

func TestLoadNetConf(t *testing.T) {
	testData := []byte(`
{
  "cniVersion": "0.3.1",
  "name": "mizarmp-default",
  "type": "mizarmp",
  "mpurl": "http://127.0.0.1:8080",
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

	if netConf.MizarMPServiceURL != "http://127.0.0.1:8080" {
		t.Errorf("mizar-mp service URL: expected http://127.0.0.1:8080, got %q", netConf.MizarMPServiceURL)
	}

	if netConf.ProjectID != "3dda2801-d675-4688-a63f-dcda8d327f50" {
		t.Errorf("expected '3dda2801-d675-4688-a63f-dcda8d327f50', got %q", netConf.ProjectID)
	}

	if netConf.SubnetID != "a87e0f87-a2d9-44ef-9194-9a62f178594e" {
		t.Errorf("expected 'a87e0f87-a2d9-44ef-9194-9a62f178594e', got %q", netConf.SubnetID)
	}
}
