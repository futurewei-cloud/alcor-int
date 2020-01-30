# Mizar Programming Flow
This document layout the Mizar programming flow based on https://github.com/futurewei-cloud/mizar/tree/master/test/trn_controller

## 1. controller.create_vpc(self, vni, cidr, routers):
        """
        Create a vpc of unique VNI, CIDR block and optional list of
        routers.
        1. Adds the vpc to the VPCs dict
        2. For that VPC, call add_router for each router in the list
        """
* for each router in the input routers list
  * call 1.1 vpcs[vni].add_router(router)

### 1.1. vpc.add_router(self, droplet):
        """
        Add a new transit router hosted at droplet to the set transit
        routers.
        1. Adds the router to the set of transit routers
        2. Call update_net on the transit router's droplet for each
           network of the VPC. These calls populate the transit
           routers table with the set of transit switches of each
           network.
        3. Call update_vpc on each network of the VPC. This call allows
           all transit switches of all networks to learn about the new
           router and starts sending packets to it. Thus, must be
           called after all transit router's data has been populated.
        """
* create a new transit_router object: self.transit_routers[id] = transit_router(droplet)
* for each switch in the subnet within the VPC:
  * call 1.1.1. transit_routers[id].update_net(net, droplet)
  * call 1.2.1. net.update_vpc(self)
  
### 1.1.1. transit_router.update_net(self, net, droplet, remove_switch=False):
        """
        Calls an update_net rpc to the transit router's droplet. After
        this the transit router has an updated list of the network's
        transit switch. Also calls update_substrate_endpoint to
        populate the mac addresses of the transit switches' droplets.
        """
* call 0.1.1.1. self.droplet.update_net(net)
* if remove_switch: call 0.1.1.2. self.droplet.delete_substrate_ep(droplet)
  * else: call 0.1.1.3. self.droplet.update_substrate_ep(droplet)

### 1.2.1. net.update_vpc(self):
        """
        Called when vpc data changes (e.g router is added to the VPC).
        Cascades an update_vpc rpc to all transit switches of the network.
        """
* for each switch in the subnet within the VPC:
  * call 1.2.1.1. switch.update_vpc(vpc)
  
### 1.2.1.1. transit_switch.update_vpc(self, vpc):
        """
        Calls an update_vpc rpc to the transit switch's droplet. After
        this the switch has an updated list of the VPC's transit
        routers. Also calls update_substrate_ep to populate the
        mac addresses of the transit routers' droplets.
        """
* call 0.1.1.4. self.droplet.update_vpc(vpc)
* for each transit router in the VPC:
  * call 0.1.1.3. self.droplet.update_substrate_ep(r.droplet)
  * question: since we can going through all the transit switches in 1.2.1., 
  * are we calling this for loop too many times after the first 1.2.1. call?
  * if yes, I guess it doesn't hurt a lot to program the same thing multiple times.


## 2. controller.create_network(self, vni, netid, cidr, switches):
        """
        Creates a network in a VPC identified by VNI.
        1. Call create_network in that VPC
        2. For that network, call add_switch for each switch in the list
        """
* call 2.1. self.vpcs[vni].create_network(netid, cidr)
* for each switch in the input switches list
  * call 2.2. self.add_switch(vni, netid, s)
  
### 2.1. vpc.create_network(self, netid, cidr):
        """
        Creates a network in the VPC. Since the network does not have
        transit switches yet, this function just adds a network object
        to the set of networks.
        """
* create a new network object: network(self.vni, netid, cidr)
* call 2.1.1. self.networks[netid].create_gw_endpoint()

### 2.1.1. network.create_gw_endpoint(self):
        """
        Allocates the first IP of the network CIDR range and
        Creates a phantom endpoint (without a host).
        """
* call (see 3.1.1.) self.endpoints[ip] = endpoint(
       self.vni, self.netid, ip=ip, prefixlen=self.cidr.prefixlen, gw_ip=None, host=None)        

### 2.2. controller.add_switch(self, vni, netid, s):
        """
        Adds a new switch to an existing network.
        """
* call 2.2.1. self.vpcs[vni].create_network(netid, cidr)

### 2.2.1. vpc.add_switch(self, netid, droplet):
        """
        Adds a switch to the network identified by netid.
        1. Cascade the add switch call to the network, which populate
           the data of the new transit switch including the set of
           transit routers of the VPC.
        2. Call update_net on all the VPC's transit routers to allow
           the routers to forward traffic to the new switch. From
           traffic perspective, the order of update_net and add_switch
           is not important in this case. We just need to call
           update_net here after the switch is added to the transit
           switches set of the network.
        """
* call 2.2.1.1. self.networks[netid].add_switch(self, droplet)
* for each router within the VPC:
  * call 1.1.1. r.update_net(self.networks[netid], droplet)

### 2.2.1.1. network.add_switch(self, vpc, droplet):
        """
        Adds a transit switch of this network hosted at the given droplet.
        1. Creates the switch object and add it to the list
        2. Call update_vpc on the new transit switch's droplet to
           update it with the list of transit routers of the VPC
        3. Call update_endpoint on the transit switch's droplet to
           update it with all endpoint's data within this network
        4. Finally call update on each endpoint's
           transit agent within the network, so they can start sending
           packets to the new transit switch.
        """
* create a new transit_switch object: self.transit_switches[id] = transit_switch(droplet)
* call 2.2.1.1.1. self.transit_switches[id].update_vpc(vpc)
* for each endpoint in the subnet:
  * call 3.1.1.1. self.transit_switches[id].update_endpoint(ep)
  * which should do nothing when there is no endpoint
* for each endpoint in the subnet:
  * call 3.1.1.2. transit_switches
  * which should do nothing when there is no endpoint

### 2.2.1.1.1. transit_switches.update_vpc(self, vpc):
        """
        Calls an update_vpc rpc to the transit switch's droplet. After
        this the switch has an updated list of the VPC's transit
        routers. Also calls update_substrate_ep to populate the
        mac addresses of the transit routers' droplets.
        """
* call 0.1.1.4. self.droplet.update_vpc(vpc)
* for each router within the VPC:
  * call 0.1.1.3. self.droplet.update_substrate_ep(r.droplet)

## 3. controller.create_simple_endpoint(self, vni, netid, ip, host):

* call 3.1. self.vpcs[vni].create_simple_endpoint(netid, ip, self.droplets[host])

### 3.1. vpc.create_simple_endpoint(self, netid, ip, host):
        """
        Creates a new simple endpoint in a network within the vpc.
        Since the routers need not to be updated with the endpoint
        data, this call is just cascaded to the network.
        """
* call 3.1.1. self.networks[netid].create_simple_endpoint(ip, host)

### 3.1.1. network.create_simple_endpoint(self, ip, host):
        """
        Creates a simple endpoint in the network.
        1. First create the endpoint object and add it to the set of
           endpoints
        2. Call update_endpoint on at least one transit switch of the
           network (two or three switches may be a good idea in production!).
        3. Call update on each endpoint's transit agent within the
           network. The endpoint becomes ready to send  packets.
        """
* get the list of transit_switch: switches = list(self.transit_switches.values())
* create an endpoint object: endpoint(self.vni, self.netid, ip=ip, 
            prefixlen=self.cidr.prefixlen, gw_ip=self.get_gw_ip(), host=host)
  * create the transit_agent object
  * call self.host.provision_simple_endpoint(self):
    * droplet._create_veth_pair(ep)
    * droplet.load_transit_agent_xdp(ep.veth_peer)
  * call 0.2. self.host.update_ep(self)
* for each transit switch within the subnet:
  * call 3.1.1.1 switch.update_endpoint(self.endpoints[ip])
* call 3.1.1.2. self.endpoints[ip].update(self)
* Question: please confirm the flow as I removed the logic for time measurement

### 3.1.1.1. transit_switch.update_endpoint(self, ep):
        """
        Calls an update_endpoint rpc to transit switch's droplet.
        After this the switch can forward tunneled packets to the
        endpoint's host. Also calls update_substrate_ep to
        populate the mac addresses of the endpoint's host.
        """
* call 0.2. self.droplet.update_ep(ep)   
* if ep.host is not None: call 0.1.1.3. self.droplet.update_substrate_ep(ep.host)
  * ep.host could be None for phantom ep

### 3.1.1.2. endpoint.update(self, net):
        """
        Prepares or update the endpoint to send traffic. An endpoint
        is assumed ready to serve traffic if this function is called once.
        """
        if self.host is not None: # call 3.1.1.3.
            self.transit_agent.update_agent_metadata(self, net)

### 3.1.1.3. transit_agent.update_agent_metadata(self, ep, net):
        """
        Calls update_agent_metadata to update the agents with
        modifications in net transit switches or endpoint data.
        1. Update the list of transit switches of the endpoint's
           network (update_agent_metadata)
        2. Update the substrate endpoints with the switches mac/ip
           addresses. This is necessary since the data-plane do not do
           ARP actively if the mac is missing (at this point).
        """
* call 0.3.1 self.droplet.update_agent_metadata(self.veth_peer, ep, net)
* for each transit switch within the subnet:
  * call 0.3.2 self.droplet.update_agent_substrate_ep(self.veth_peer, s.droplet)

## 0. droplet class:

### 0.1.1.1. droplet.update_net(self, net, expect_fail=False):
        """
        jsonconf = {
            "tunnel_id": net.get_tunnel_id(),
            "nip": net.get_nip(),
            "prefixlen": net.get_prefixlen(),
            "switches_ips": net.get_switches_ips()
        }
        cmd = f'''{self.trn_cli_update_net} \'{jsonconf}\''''
        """
        
### 0.1.1.2. droplet.delete_substrate_ep(self, droplet, expect_fail=False):
        """
        jsonconf = droplet.get_substrate_ep_json()
        jsonkey = {
            "tunnel_id": "0",
            "ip": droplet.ip,
        }
        key = ("ep_substrate " + self.phy_itf,
               json.dumps(jsonkey))
        cmd = f'''{self.trn_cli_delete_ep} \'{jsonconf}\''''
        self.do_delete_decrement( # call 0.1.1.2.1.
            log_string, cmd, expect_fail, key, self.substrate_updates)
        """

### 0.1.1.2.1. droplet.do_delete_decrement(self, log_string, cmd, expect_fail, key, update_counts):
        """
        if update_counts[key] > 0:
            update_counts[key] -= 1
            if update_counts[key] == 0:
                self.rpc_deletes[key] = time.time()
                self.exec_cli_rpc(log_string, cmd, expect_fail)
        """

### 0.1.1.3. droplet.update_substrate_ep(self, droplet, expect_fail=False):
        """
        jsonconf = droplet.get_substrate_ep_json()
        jsonkey = {
            "tunnel_id": "0",
            "ip": droplet.ip,
        }
        key = ("ep_substrate " + self.phy_itf,
               json.dumps(jsonkey))
        cmd = f'''{self.trn_cli_update_ep} \'{jsonconf}\''''
        self.do_update_increment( # call 0.1.1.3.1.
            log_string, cmd, expect_fail, key, self.substrate_updates)        
        """
        
### 0.1.1.3.1. droplet.do_update_increment(self, log_string, cmd, expect_fail, key, update_counts):
        """
        if key in update_counts.keys():
            update_counts[key] += 1
        else:
            update_counts[key] = 1
        self.rpc_updates[key] = time.time()
        self.exec_cli_rpc(log_string, cmd, expect_fail)
        """        

### 0.1.1.4. droplet.update_vpc(self, vpc, expect_fail=False):
        jsonconf = {
            "tunnel_id": vpc.get_tunnel_id(),
            "routers_ips": vpc.get_transit_routers_ips()
        }
        jsonconf = json.dumps(jsonconf)

        jsonkey = {
            "tunnel_id": vpc.get_tunnel_id(),
        }
        key = ("vpc " + self.phy_itf, json.dumps(jsonkey))
        cmd = f'''{self.trn_cli_update_vpc} \'{jsonconf}\''''
        self.do_update_increment( # call 0.1.1.3.1.
            log_string, cmd, expect_fail, key, self.vpc_updates)

### 0.2. droplet.update_ep(self, ep, expect_fail=False):
        # Only detail veth info if the droplet is also a host
        # NOTE: control agent doesn't know that.
        if (ep.host and self.ip == ep.host.ip):
            peer = ep.get_veth_peer()

        jsonconf = {
            "tunnel_id": ep.get_tunnel_id(),
            "ip": ep.get_ip(),
            "eptype": ep.get_eptype(),
            "mac": ep.get_mac(),
            "veth": ep.get_veth_name(),
            "remote_ips": ep.get_remote_ips(),
            "hosted_iface": peer
        }
        jsonconf = json.dumps(jsonconf)
        jsonkey = {
            "tunnel_id": ep.get_tunnel_id(),
            "ip": ep.get_ip(),
        }
        key = ("ep " + self.phy_itf, json.dumps(jsonkey))
        cmd = f'''{self.trn_cli_update_ep} \'{jsonconf}\''''
        self.do_update_increment( # call 0.1.1.3.1.
            log_string, cmd, expect_fail, key, self.endpoint_updates)
            
### 0.3.1. droplet.update_agent_metadata(self, itf, ep, net, expect_fail=False):
        log_string = "[DROPLET {}]: update_agent_metadata on {} for endpoint {}".format(
            self.id, itf, ep.ip)
        jsonconf = {
            "ep": {
                "tunnel_id": ep.get_tunnel_id(),
                "ip": ep.get_ip(),
                "eptype": ep.get_eptype(),
                "mac": ep.get_mac(),
                "veth": ep.get_veth_name(),
                "remote_ips": ep.get_remote_ips(),
                "hosted_iface": "eth0"
            },
            "net": {
                "tunnel_id": net.get_tunnel_id(),
                "nip": net.get_nip(),
                "prefixlen": net.get_prefixlen(),
                "switches_ips": net.get_switches_ips()
            },
            "eth": {
                "ip": self.ip,
                "mac": self.mac,
                "iface": "eth0"
            }
        }
        jsonconf = json.dumps(jsonconf)
        cmd = f'''{self.trn_cli_update_agent_metadata} -i \'{itf}\' -j \'{jsonconf}\''''
        self.exec_cli_rpc(log_string, cmd, expect_fail)
        
 ### 0.3.2. droplet.update_agent_substrate_ep(self, itf, droplet, expect_fail=False):
        jsonconf = droplet.get_substrate_ep_json()
        cmd = f'''{self.trn_cli_update_agent_ep} -i \'{itf}\' -j \'{jsonconf}\''''
        self.exec_cli_rpc(log_string, cmd, expect_fail)


# What is not included?
* delete_simple_endpoint(self, vni, netid, ip, host):
* delete_network(self, vni, netid, cidr, switches):
* delete_vpc(self, vni, cidr, routers):
* remove_switch(self, vni, netid, s, net=None):
* remove_router(self, vni, r, vpc=None):
* how to we move a transit switch/router?
