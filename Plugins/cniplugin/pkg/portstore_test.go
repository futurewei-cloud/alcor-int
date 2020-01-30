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
	"testing"
)

func TestRecordReadDelete(t *testing.T) {
	portID := "67b2ba30-1de7-11ea-978f-2e728ce88125"
	sandbox := "7e2360c6-c9aa-4b62-b241-3abb68fa8a69"
	nic := "eth0"

	store := &PortIDStore{rootPath: "/tmp/portidstore/"}
	if err := store.Record(portID, sandbox, nic); err != nil {
		t.Fatalf("failed to record port ID: %v", err)
	}

	result, err := store.Get(sandbox, nic)
	if err != nil {
		t.Errorf("failed top retrieve port ID: %v", err)
	}
	if result != portID {
		t.Errorf("expected %q, got %q", portID, result)
	}

	if err := store.Delete(sandbox, nic); err != nil {
		t.Errorf("failed to clean up: %v", err)
	}
}
