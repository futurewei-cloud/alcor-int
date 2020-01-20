# Mizar Programming Flow
This document layout the Mizar programming flow based on https://github.com/futurewei-cloud/mizar/tree/master/test/trn_controller

## 1. Create a VPC - controller.create_vpc(self, vni, cidr, routers):
        """
        Create a vpc of unique VNI, CIDR block and optional list of
        routers.
        1. Adds the vpc to the VPCs dict
        2. For that VPC, call add_router for each router in the list
        """
* for each router in the input routers list
  * call 1.1 vpcs[vni].add_router(router)

### 1.1. Add a Router - vpc.add_router(self, droplet):
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
* for each switch in the subnet within the VPC:
  * call 1.1.1. transit_routers[id].update_net(net, droplet)
  * call 2.1.2. net.update_vpc(self)
  
### 1.1.1. transit_router.update_net(self, net, droplet, remove_switch=False):
        """
        Calls an update_net rpc to the transit router's droplet. After
        this the transit router has an updated list of the network's
        transit switch. Also calls update_substrate_endpoint to
        populate the mac addresses of the transit switches' droplets.
        """
* call 1.1.1.1. self.droplet.update_net(net)
* if remove_switch: call 1.1.1.2. self.droplet.delete_substrate_ep(droplet)
  * else: call 1.1.1.3. self.droplet.update_substrate_ep(droplet)
  
### 1.1.1.1. droplet.update_net(self, net, expect_fail=False):
        """
        jsonconf = {
            "tunnel_id": net.get_tunnel_id(),
            "nip": net.get_nip(),
            "prefixlen": net.get_prefixlen(),
            "switches_ips": net.get_switches_ips()
        }
        cmd = f'''{self.trn_cli_update_net} \'{jsonconf}\''''
        """
        
### 1.1.1.2. droplet.delete_substrate_ep(self, droplet, expect_fail=False):
        """
        jsonconf = droplet.get_substrate_ep_json()
        jsonkey = {
            "tunnel_id": "0",
            "ip": droplet.ip,
        }
        key = ("ep_substrate " + self.phy_itf,
               json.dumps(jsonkey))
        cmd = f'''{self.trn_cli_delete_ep} \'{jsonconf}\''''
        self.do_delete_decrement( # call 1.1.1.2.1.
            log_string, cmd, expect_fail, key, self.substrate_updates)
        """

### 1.1.1.2.1. droplet.do_delete_decrement(self, log_string, cmd, expect_fail, key, update_counts):
        """
        if update_counts[key] > 0:
            update_counts[key] -= 1
            if update_counts[key] == 0:
                self.rpc_deletes[key] = time.time()
                self.exec_cli_rpc(log_string, cmd, expect_fail)
        """

### 1.1.1.3. droplet.update_substrate_ep(self, droplet, expect_fail=False):
        """
        jsonconf = droplet.get_substrate_ep_json()
        jsonkey = {
            "tunnel_id": "0",
            "ip": droplet.ip,
        }
        key = ("ep_substrate " + self.phy_itf,
               json.dumps(jsonkey))
        cmd = f'''{self.trn_cli_update_ep} \'{jsonconf}\''''
        self.do_update_increment( call 1.1.1.3.1.
            log_string, cmd, expect_fail, key, self.substrate_updates)        
        """
        
### 1.1.1.3.1. droplet.do_update_increment(self, log_string, cmd, expect_fail, key, update_counts):
        """
        if key in update_counts.keys():
            update_counts[key] += 1
        else:
            update_counts[key] = 1
        self.rpc_updates[key] = time.time()
        self.exec_cli_rpc(log_string, cmd, expect_fail)
        """        

### 1.1.1.4. droplet.update_vpc(self, vpc, expect_fail=False):
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

### 2.1.2. net.update_vpc(self):
        """
        Called when vpc data changes (e.g router is added to the VPC).
        Cascades an update_vpc rpc to all transit switches of the network.
        """
* for each switch in the subnet within the VPC:
  * call 2.1.2.1. switch.update_vpc(vpc)
  
### 2.1.2.1. transit_switch.update_vpc(self, vpc):
        """
        Calls an update_vpc rpc to the transit switch's droplet. After
        this the switch has an updated list of the VPC's transit
        routers. Also calls update_substrate_ep to populate the
        mac addresses of the transit routers' droplets.
        """
* call 1.1.1.4. self.droplet.update_vpc(vpc)
* for each transit router in the VPC:
  * call 1.1.1.3. self.droplet.update_substrate_ep(r.droplet)
  * question: since we can going through all the transit switches in 2.1.2, 
  * are we calling this for loop too many times after the first 2.1.2 call?
  * if yes, I guess it doesn't help as we can program the same thing multiple times.

## Create a Subnet

* 1
* 2

## Create an Endpoint

* 1
* 2
