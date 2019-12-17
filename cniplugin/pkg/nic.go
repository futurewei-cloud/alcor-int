package pkg

import (
	"github.com/containernetworking/plugins/pkg/ns"
	"github.com/vishvananda/netlink"
)

func FindNicInNs(device, nsPath string) error {
	return ns.WithNetNSPath(nsPath, func(nsOrig ns.NetNS) error {
		_, err := netlink.LinkByName(device)
		return err
	})
}
