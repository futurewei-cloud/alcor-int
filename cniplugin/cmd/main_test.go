package main_test

import (
	"bytes"
	"github.com/containernetworking/cni/pkg/version"
	"github.com/onsi/gomega/gexec"
	"os/exec"
	"testing"
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
