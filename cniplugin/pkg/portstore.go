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
	"io/ioutil"
	"os"
	"path"
)

const defaultStoreRootPath = "/etc/mizarmp_ports/"

// PortIDStore keeps poirt id for sandbox/nic in persistent storage
type PortIDStore struct {
	rootPath string
}

// NewPortIDStore generates a local persistent store
func NewPortIDStore() *PortIDStore {
	return &PortIDStore{rootPath: defaultStoreRootPath}
}

// Record records port id of sandbox/nic
func (p PortIDStore) Record(portID, sandbox, nic string) error {
	portPath := path.Join(p.rootPath, sandbox, nic)
	_, err := os.Stat(portPath)
	if !os.IsNotExist(err) {
		return err
	}

	os.MkdirAll(path.Join(p.rootPath, sandbox), os.ModeDir|0750)
	f, err := os.Create(portPath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(portID)
	return err
}

// Get gets back the port id of sandbox/nic
func (p PortIDStore) Get(sandbox, nic string) (string, error) {
	portPath := path.Join(p.rootPath, sandbox, nic)
	data, err := ioutil.ReadFile(portPath)
	return string(data), err
}

// Delete deletes port id of sandbox/nic
func (p PortIDStore) Delete(sandbox, nic string) error {
	portPath := path.Join(p.rootPath, sandbox, nic)
	if err := os.Remove(portPath); err != nil {
		return err
	}

	if err := os.Remove(path.Join(p.rootPath, sandbox)); err != nil {
		return err
	}

	return nil
}
