// MIT License
// Copyright(c) 2020 Futurewei Cloud
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files(the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { get_alcor_services_info, get_service_port_map } from './alcor_services.js'
import * as create_test_setup from './create_test_setup.js'
import { put_httprequest, post_httprequest, get_httprequest, get_mac_from_db } from './prepare_payload.js'

// test_case is the scenario section header, must contain
// all of the subnet information. Different scenarios may use
// the same test_case setup so to avoid confusion, passin
// the scenario name which will appear in the test output.
export function create_subnets(snm_port, test_case, scenario) {
    console.log(`creating subnets for scenario ${scenario}`);
    let id_list = get_alcor_services_info(test_case, "subnet_ids")
    let id_names = get_alcor_services_info(test_case, "subnet_names")
    let device_ids = get_alcor_services_info(test_case, "device_ids")
    let cidrs = get_alcor_services_info(test_case, "cidrs")
    let ip_addrs = get_alcor_services_info(test_case, "ip_addrs")
    let subnetinfo = get_alcor_services_info("subnet_info", "subnet_info")

    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${snm_port}/project/${projectid}/subnets`
    console.log("url: " + url)

    let length = Math.min(cidrs.length, id_list.length, id_names.length)
    let subnet = {}
    for (let idx = 0; idx < length; idx++) {
        subnetinfo['cidr'] = cidrs[idx]
        subnetinfo['id'] = id_list[idx]
        subnetinfo['name'] = id_names[idx]
        subnet["subnet"] = subnetinfo
        post_httprequest(url, subnet)
    }
    console.log("verifying created subnets")
    let res = get_httprequest(url);
    console.log(JSON.stringify(res));
    console.log(`FINISH: created subnets for scenario ${scenario}`)
    return { "id_list": id_list, "device_ids": device_ids, "ip_addrs": ip_addrs }
}


export function create_security_groups(port) {
    console.log("Creating security groups")
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/security-groups`
    console.log("url: " + url)

    let sginfo = get_alcor_services_info("security_groups", "security_group_info")
    let id_list = get_alcor_services_info("L2_basic", "security_group_ids")
    let id_names = get_alcor_services_info("L2_basic", "sg_names")
    let device_ids = get_alcor_services_info("L2_basic", "device_ids")

    let length = Math.min(device_ids.length, id_list.length, id_names.length)
    let security_groups = {}
    for (let idx = 0; idx < length; idx++) {
        sginfo['id'] = id_list[idx]
        sginfo['name'] = id_names[idx]
        security_groups["security_group"] = sginfo
        console.log("SG ", JSON.stringify(security_groups))
        post_httprequest(url, security_groups)
    }
    console.log("FINISH: creating security groups");
    return { "id_list": id_list, "device_ids": device_ids }
}

export function attach_subnets_to_router(rm_port, snm_port, router_id, subnet_id_list) {
    console.log("Attaching subnets to router")
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${rm_port}/project/${projectid}/routers/${router_id}/add_router_interface`

    for (let id in subnet_id_list) {
        let subnet_info = { "subnet_id": id }
        put_httprequest(url, subnet_info)
    }

    let req = `http://localhost:${rm_port}/project/${projectid}/routers`
    console.log("Attached router info")
    let res = get_httprequest(req)
    console.log(JSON.stringify(res))
    console.log("FINISH: attaching subnets to router")
}

export function create_port_goal_states(port, change_ports) {
    console.log("Creating goal state...")
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/ports`

    let port_dict = get_alcor_services_info("port_info", "port_info")
    let port_name = port_dict['name']
    let port_id = port_dict['id']
    let node_name = port_dict['binding:host_id']

    let subnet_ids = []
    let security_groups = []
    let ip_addrs = []
    let changes = change_ports['change']

    let device_ids = []
    if ('subnet_id' in changes) {
        subnet_ids = change_ports['subnet_id']
    }
    else {
        //   Adding the same subnet ID twice because it is going to be same for two ports we are creating
        subnet_ids.push(port_dict['subnet_id'])
        subnet_ids.push(port_dict['subnet_id'])
    }

    if ('device_id' in changes) {
        device_ids = change_ports['device_ids']
    }
    else {
        console.log("Adding same device id twice...")
        //   Adding the same device ID twice because it is going to be same for two ports we are creating
        device_ids.push(port_dict['device_id'])
        device_ids.push(port_dict['device_id'])
    }

    if ('security_groups' in changes) {
        security_groups = change_ports['security_groups']
    }
    else {
        //   Adding the same security group ID twice because it is going to be same for two ports we are creating
        security_groups.push(port_dict['security_groups'])
        security_groups.push(port_dict['security_groups'])
    }

    if ('ip_addrs' in changes) {
        ip_addrs = change_ports['ip_addrs']
    }
    else {
        ip_addrs = port_dict['fixed_ips']
    }

    for (let index = 0; index < ip_addrs.length; index++) {
        let ports = {}
        let port_info = {
            "admin_state_up": true,
            "allowed_address_pairs": [
                {
                    "ip_address": "11.11.11.11",
                    "mac_address": "00-AA-BB-15-EB-3F"
                }
            ],
            "binding:host_id": node_name[index],
            "binding:vif_details": {},
            "create_at": "string",
            "description": "string",
            "device_id": device_ids[index],
            "device_owner": "compute:nova",
            "dns_assignment": {},
            "dns_domain": "string",
            "dns_name": "string",
            "extra_dhcp_opts": [
                {
                    "ip_version": "string",
                    "opt_name": "string",
                    "opt_value": "string"
                }
            ],
            "fast_path": true,
            "fixed_ips": [
                {
                    "ip_address": ip_addrs[index],
                    "subnet_id": subnet_ids[index]
                }
            ],
            "id": port_id[index],
            "mac_learning_enabled": true,
            "name": port_name[index],
            "network_id": port_dict['network_id'],
            "network_ns": "string",
            "port_security_enabled": true,
            "project_id": port_dict['project_id'],
            "qos_network_policy_id": "string",
            "qos_policy_id": "string",
            "revision_number": 0,
            "security_groups": [security_groups[index]],
            "tags": ["string"],
            "tenant_id": port_dict['tenant_id'],
            "update_at": "string",
            "uplink_status_propagation": true,
            "veth_name": "string"
        }
        ports["port"] = port_info
        console.log("ports: " + JSON.stringify(ports))
        console.log("url: " + url)
        console.log("Posting goal state")
        post_httprequest(url, ports)
    }
    console.log("FINISH: creating goal state...")
}


//  Test case 1: L2 Basic
//  Two nodes in same subnet in different seurity groups
export function prepare_test_L2_basic(ip_mac, ser_port) {
    let test_name = "L2_basic"
    console.log(`Preparing test case ${test_name}...`)

    create_test_setup.create_default_segment_table(ser_port["sgs"])
    create_test_setup.create_vpc(ser_port["vpm"])
    create_test_setup.create_node(ser_port["nm"], ip_mac)
    create_test_setup.create_subnet(ser_port["snm"])
    let res = create_security_groups(ser_port["sgm"])
    let id_list = res["id_list"]
    let device_ids = res["device_ids"]
    let change_ports = {
        "change": ["security_groups", "device_id"],
        "security_groups": id_list,
        "device_ids": device_ids
    }
    create_port_goal_states(ser_port["pm"], change_ports)
    let ip_mac_db = get_mac_from_db()
    console.log(`Test case ${test_name}. IP/MAC in ignite DB: ` +
        JSON.stringify(ip_mac_db))
    console.log(`FINISH: preparing test case ${test_name}...`)
    return ip_mac_db
}

// Test case 2: L3_AttachRouter_then_CreatePorts (S4)
// Two nodes in different subnets, in same same sg
// Order of network element creation is:
// 1) Create default segement table
// 2) Create nodes
// 3) Create VPC
// 4) Create security group
// 5) Create create subnets
// 6) Create router
// 7) Attach subnets to router
// 8) Create ports
export function prepare_test_L3_AttachRouter_then_CreatePorts(ip_mac, ser_port) {
    let test_name = "L3_AttachRouter_then_CreatePorts"
    console.log(`Preparing test case ${test_name}...`)

    create_test_setup.create_default_segment_table(ser_port["sgs"])
    create_test_setup.create_node(ser_port["nm"], ip_mac)

    let change = { 'change': 'cidr', 'cidr': "172.16.0.0/16" }
    create_test_setup.create_vpc(ser_port["vpm"], change)
    create_test_setup.create_security_group(ser_port["sgm"])

    // create router
    let router_id = create_test_setup.create_router_interface(ser_port["rm"])
    create_test_setup.get_vpcs(ser_port["vpm"])

    // create subnets
    // Relevant subnet info from L3_AttachRouter_then_CreatePorts (S4)
    let res = create_subnets(ser_port["snm"], test_name, "S4")
    let id_list = res["id_list"]
    let device_ids = res["device_ids"]
    let ip_addrs = res["ip_addrs"]

    // attach subnets to router
    attach_subnets_to_router(ser_port["rm"], ser_port["snm"], router_id, id_list)
    create_test_setup.get_subnets(ser_port["snm"])
    let change_ports = {
        "change": [
            "subnet_id",
            "device_id",
            "ip_addrs"
        ],
        "subnet_id": id_list,
        "device_ids": device_ids,
        "ip_addrs": ip_addrs
    }
    create_port_goal_states(ser_port["pm"], change_ports)

    let ip_mac_db = get_mac_from_db()
    console.log(`Test case ${test_name}. IP/MAC in ignite DB: ` +
        JSON.stringify(ip_mac_db))
    console.log(`FINISH: preparing test case ${test_name}...`)
    return ip_mac_db
}

// test case 3: L3_CreatePorts_then_AttachRouter (S5)
// Two nodes in different subnets and same security group but
// Order of network element creation is:
// 1) Create default segement table
// 2) Create nodes
// 3) Create VPC
// 4) Create security group
// 5) Create create subnets
// 6) Create ports
// 7) Create router
// 8) Attach subnets to router
export function prepare_test_L3_CreatePorts_then_AttachRouter(ip_mac, ser_port) {
    let test_name = "L3_CreatePorts_then_AttachRouter"
    console.log(`Preparing test case ${test_name}...`)

    create_test_setup.create_default_segment_table(ser_port["sgs"])
    create_test_setup.create_node(ser_port["nm"], ip_mac)
    let change = { 'change': 'cidr', 'cidr': "172.16.0.0/16" }
    create_test_setup.create_vpc(ser_port["vpm"], change)
    create_test_setup.get_vpcs(ser_port["vpm"])
    create_test_setup.create_security_group(ser_port["sgm"])

    // create subnets
    // Relevant subnet info from L3_AttachRouter_then_CreatePorts (S4)
    let res = create_subnets(ser_port["snm"],
        "L3_AttachRouter_then_CreatePorts", "S5")

    let id_list = res["id_list"]
    let device_ids = res["device_ids"]
    let ip_addrs = res["ip_addrs"]

    create_test_setup.get_subnets(ser_port["snm"])

    // create ports
    let change_ports = {
        "change": [
            "subnet_id",
            "device_id",
            "ip_addrs"
        ],
        "subnet_id": id_list,
        "device_ids": device_ids,
        "ip_addrs": ip_addrs
    }
    create_port_goal_states(ser_port["pm"], change_ports)

    // create router
    let router_id = create_test_setup.create_router_interface(ser_port["rm"])

    // attach subnets to router
    attach_subnets_to_router(ser_port["rm"], ser_port["snm"], router_id, id_list)

    let ip_mac_db = get_mac_from_db()
    console.log(`Test case ${test_name}. IP/MAC in ignite DB: ` +
        JSON.stringify(ip_mac_db))
    console.log(`FINISH: preparing test case ${test_name}...`)
    return ip_mac_db
}

export default function () {
     let ip_mac = [{ "ip": "172.16.62.212", "mac": "a4:ae:12:79:c9:81" }, { "ip": "172.16.62.213", "mac": "a4:ae:12:79:5a:27" }]
     let ser_port = get_service_port_map()
     prepare_test_L2_basic(ip_mac, ser_port)
//     prepare_test_L3_AttachRouter_then_CreatePorts(ip_mac, ser_port)
//     prepare_test_L3_CreatePorts_then_AttachRouter(ip_mac, ser_port)
}

