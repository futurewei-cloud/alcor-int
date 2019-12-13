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
