package main

import (
	"encoding/json"
	"fmt"
	"github.com/containernetworking/cni/pkg/types"
)

type netConf struct {
	types.NetConf
	MizarMPServiceURL string `json:"mpurl"`
	ProjectID string `json:"project"`
	SubnetID string `json:"subnet"`
	HostID string `json:"host"`
}

func loadNetConf(data []byte) (*netConf, error) {
	n := &netConf{}
	if err := json.Unmarshal(data, n); err != nil {
		return nil, fmt.Errorf("failed to load mizar_mp specific conf: %v", err)
	}

	return n, nil
}
