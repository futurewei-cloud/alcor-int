package pkg

import (
	"io/ioutil"
	"os"
	"path"
)

const storeRootPath = "/etc/mizarmp_ports/"

func Record(portID, sandbox, nic string) error {
	portPath := path.Join(storeRootPath, sandbox, nic)
	_, err := os.Stat(portPath)
	if !os.IsNotExist(err) {
		return err
	}

	f, err := os.Create(portPath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(portID)
	return err
}

func Get(sandbox, nic string) (string, error) {
	portPath := path.Join(storeRootPath, sandbox, nic)
	data, err := ioutil.ReadFile(portPath)
	return string(data), err
}
