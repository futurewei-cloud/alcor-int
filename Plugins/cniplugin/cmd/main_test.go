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
package main_test

import (
	"bytes"
	"os/exec"
	"testing"

	"github.com/containernetworking/cni/pkg/version"
	"github.com/onsi/gomega/gexec"
)

func TestVersion(t *testing.T) {
	binary, err := gexec.Build("github.com/futurewei-cloud/mizar-mp/cniplugin/cmd")
	if err != nil {
		t.Fatalf("failed to build binary: %v", err)
	}
	defer gexec.CleanupBuildArtifacts()

	cmd := exec.Command(binary)
	cmd.Env = append(cmd.Env, "CNI_COMMAND=VERSION")
	stdout := new(bytes.Buffer)
	cmd.Stdout = stdout

	if err := cmd.Run(); err != nil {
		t.Fatalf("failed to run binary: %v", err)
	}

	decoder := version.PluginDecoder{}
	pluginInfo, err := decoder.Decode(stdout.Bytes())
	if err != nil {
		t.Fatalf("failed to parse version output: %v", err)
	}

	supportedVersions := pluginInfo.SupportedVersions()
	for _, v := range supportedVersions {
		if v == "0.3.1" {
			return
		}
	}

	t.Errorf("expected version '0.3.1'; got %q", supportedVersions)
}
