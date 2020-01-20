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

## 2. create_network(self, vni, netid, cidr, switches):
        """
        Creates a network in a VPC identified by VNI.
        1. Call create_network in that VPC
        2. For that network, call add_switch for each switch in the list
        """
* for each switch in the input routers list
  * call 2.1 self.add_switch(vni, netid, s)
  
### 2.1. controller.add_switch(self, vni, netid, s):
        """
        Adds a new switch to an existing network.
        """
* call 2.1.1. self.vpcs[vni].add_switch(netid, switch)

### 2.1.1. vpc.add_switch(self, netid, droplet):
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
* create a new transit_switch object: self.networks[netid].add_switch(self, droplet)
* for each router within the VPC:
  * call 1.1.1. r.update_net(self.networks[netid], droplet)


## 3. create_simple_endpoint(self, vni, netid, ip, host):

* 1
* 2


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
        self.do_update_increment( call 0.1.1.3.1.
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
        self.do_update_increment( call 1.1.1.3.1.
            log_string, cmd, expect_fail, key, self.vpc_updates)
