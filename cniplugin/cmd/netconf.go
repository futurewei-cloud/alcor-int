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

import (
	"encoding/json"
	"fmt"

	"github.com/containernetworking/cni/pkg/types"
)

type netConf struct {
	types.NetConf
	MizarMPServiceURL string `json:"mpurl"`
	ProjectID         string `json:"project"`
	SubnetID          string `json:"subnet"`
	HostID            string `json:"hostId"`
}

func loadNetConf(data []byte) (*netConf, error) {
	n := &netConf{}
	if err := json.Unmarshal(data, n); err != nil {
		return nil, fmt.Errorf("failed to load mizar_mp specific conf: %v", err)
	}

	return n, nil
}
