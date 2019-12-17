package pkg

import (
	"fmt"
	"net"
	"github.com/vishvananda/netlink"
	"github.com/containernetworking/plugins/pkg/ns"
)

func getV4Gateway(device string) (*net.IP, int, error) {
	link, _ := netlink.LinkByName(device)
	routes, err := netlink.RouteList(link, netlink.FAMILY_V4)
	if err != nil {
		return nil, 0, fmt.Errorf("unable to get route list of dev %s: %v", device, err)
	}

	// try to get from the first default route entry
	for _, r := range routes {
		if r.Dst == nil {
			return &r.Gw, r.Priority, nil
		}
	}

	// fall back to first non-default entry
	for _, r := range routes {
		if r.Src == nil && r.Gw != nil {
			return &r.Gw, r.Priority, nil
		}
	}

	return nil, 0, fmt.Errorf("unable to identify gateway for dev %s", device)
}

func GetV4Gateway(device, nsPath string) (gw *net.IP, priority int, err error) {
	err = ns.WithNetNSPath(nsPath, func(nsOrig ns.NetNS) error {
		gw, priority, err = getV4Gateway(device)
		return err
	})

	return
}

func FindNicInNs(device, nsPath string) error {
	return ns.WithNetNSPath(nsPath, func(nsOrig ns.NetNS) error {
		_, err := netlink.LinkByName(device)
		return err
	})
}
