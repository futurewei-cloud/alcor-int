//  MIT License
//  Copyright(c) 2020 Futurewei Cloud
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files(the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { sleep } from 'k6';
import { get_alcor_services_info, get_service_port_map } from './alcor_services.js'
import { post_httprequest, get_httprequest, get_mac_from_db } from './prepare_payload.js'

export function create_default_segment_table(port) {
    console.log("Create default segment table");
    let url = `http://localhost:${port}/segments/createDefaultTable`;
    sleep(3);
    post_httprequest(url)
    console.log("FINISH: Created default segment table\n");
}

export function create_node(port, ip_mac) {
    console.log("Creating nodes");
    let url = `http://localhost:${port}/nodes`;
    console.log("url: " + url)
    let data = {}
    let nodeinfo = get_alcor_services_info("node_info", "node_info")
        // console.log(JSON.stringify(nodeinfo))
    let node_name = nodeinfo['node_name']
    let node_id = nodeinfo['node_id']
        // console.log(node_name,node_id)

    // let ip_mac =[{"ip":"1.1.1.1","mac":"123"},{"ip":"2.2.2.2","mac":"345"}]
    for (let key_index = 0; key_index < ip_mac.length; key_index++) {
        let node_info = {
            "local_ip": ip_mac[key_index]["ip"],
            "mac_address": ip_mac[key_index]["mac"],
            "node_id": node_id[key_index],
            "node_name": node_name[key_index],
            "server_port": nodeinfo['server_port'],
            "veth": nodeinfo['veth']
        }
        data["host_info"] = node_info
        post_httprequest(url, data)
    }
    console.log("FINISH: Created nodes\n")
}

export function create_router_interface(port) {
    console.log("Creating router interface\n")
    let router = {}
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/routers`
    console.log("url: " + url)

    let routerinfo = get_alcor_services_info("router_info", "router_info")
    let route_info = {
        "admin_state_up": true,
        "availability_zone_hints": ["string"],
        "availability_zones": ["string"],
        "conntrack_helpers": ["string"],
        "description": "string",
        "distributed": true,
        "external_gateway_info": {
            "enable_snat": true,
            "external_fixed_ips": [],
            "network_id": routerinfo['network_id']
        },
        "flavor_id": "string",
        "gateway_ports": [],
        "ha": true,
        "id": routerinfo['id'],
        "name": routerinfo['name'],
        "owner": routerinfo['owner'],
        "project_id": routerinfo['project_id'],
        "revision_number": 0,
        "routetable": {},
        "service_type_id": "string",
        "status": "BUILD",
        "tags": ["string"],
        "tenant_id": routerinfo['tenant_id']
    }
    router['router'] = route_info
    post_httprequest(url, router)
    console.log("FINISH: Created router interface\n")
    return routerinfo['id']
}

export function create_vpc(port, change = {}) {
    console.log("Creating VPC\n")
    let network = {}
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/vpcs`
    console.log("url: " + url)

    let networkinfo = get_alcor_services_info("vpc_info", "vpc_info")
    if ('change' in change) {
        networkinfo[change['change']] = change[change['change']]
    }
    let network_info = {
        "admin_state_up": true,
        "revision_number": 0,
        "cidr": networkinfo['cidr'],
        "default": true,
        "description": "vpc",
        "dns_domain": "domain",
        "id": networkinfo['id'],
        "is_default": true,
        "mtu": 1400,
        "name": "sample_vpc",
        "port_security_enabled": true,
        "project_id": networkinfo['project_id']
    }
    network["network"] = network_info
    post_httprequest(url, network)
    console.log("FINISH: Created VPC\n")
}

export function create_subnet(port) {
    console.log("Creating Subnet\n")
    let subnet = {}
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/subnets`
    console.log("url: " + url)

    let subnetinfo = get_alcor_services_info("subnet_info", "subnet_info")
    subnet["subnet"] = subnetinfo
    post_httprequest(url, subnet)
    console.log("FINISH: Creating Subnet\n")
}

export function create_security_group(port) {
    console.log("Creating security group")
    let security_groups = {}
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/security-groups`
    console.log("url: " + url)

    let sginfo = get_alcor_services_info("security_groups", "security_group_info")
    security_groups["security_group"] = sginfo
    post_httprequest(url, security_groups)
    console.log("FINISH: Created security group\n")
}

export function get_subnets(port) {
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/subnets`
    console.log("url: " + url)

    let res = get_httprequest(url)
    console.log(JSON.stringify(res));
}

export function get_nodes(port) {
    let url = `http://localhost:${port}/nodes`
    console.log("url: " + url)

    let res = get_httprequest(url)
    console.log(JSON.stringify(res));
}

export function get_vpcs(port) {
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/vpcs`
    console.log("url: " + url)

    let res = get_httprequest(url)
    console.log(JSON.stringify(res));
}

export function get_ports(port) {
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/ports`
    console.log("url: " + url)

    let res = get_httprequest(url)
    console.log(JSON.stringify(res));
}

export function get_security_group(port) {
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/security-groups`
    console.log("url: " + url)

    let res = get_httprequest(url)
    console.log(JSON.stringify(res));
}


export function create_ports(port) {
    console.log("Creating Goal State Ports");
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/ports`
    console.log("url: " + url)

    let portinfo = get_alcor_services_info("port_info", "port_info")
    let port_name = portinfo['name']
    let port_id = portinfo['id']
    let ip_addrs = portinfo['fixed_ips']
    let node_name = portinfo['binding:host_id']
    let device_id = portinfo['device_id']

    for (let index = 0; index < ip_addrs.length; index++) {
        let ports = {}
        let port_info = {
            "admin_state_up": true,
            "allowed_address_pairs": [{
                "ip_address": "11.11.11.1",
                "mac_address": "00-AA-BB-15-EB-3F"
            }],
            "binding:host_id": node_name[index],
            "binding:vif_details": {},
            "create_at": "string",
            "description": "string",
            "device_id": device_id[index],
            "device_owner": "compute:nova",
            "dns_assignment": {},
            "dns_domain": "string",
            "dns_name": "string",
            "extra_dhcp_opts": [{
                "ip_version": "string",
                "opt_name": "string",
                "opt_value": "string"
            }],
            "fast_path": true,
            "fixed_ips": [{
                "ip_address": ip_addrs[index],
                "subnet_id": portinfo['subnet_id']
            }],
            "id": port_id[index],
            "mac_learning_enabled": true,
            "name": port_name[index],
            "network_id": portinfo['network_id'],
            "network_ns": "string",
            "port_security_enabled": true,
            "project_id": portinfo['project_id'],
            "qos_network_policy_id": "string",
            "qos_policy_id": "string",
            "revision_number": 0,
            "security_groups": [
                portinfo['security_groups']
            ],
            "tags": ["string"],
            "tenant_id": portinfo['tenant_id'],
            "update_at": "string",
            "uplink_status_propagation": true,
            "veth_name": "string"
        }
        ports["port"] = port_info
        post_httprequest(url, ports)
    }
    console.log("FINISH: Created Goal State Ports\n")
}


export function create_test_setup(ip_mac) {
    console.log("Calling Alcor APIs to generate Goal States\n")
    let service_port_map = get_service_port_map()
    console.log("service_port_map: " + JSON.stringify(service_port_map))

    create_default_segment_table(service_port_map["sgs"])
    create_vpc(service_port_map["vpm"])
    create_node(service_port_map["nm"], ip_mac)
    create_subnet(service_port_map["snm"])
    create_security_group(service_port_map["sgm"])
    create_ports(service_port_map["pm"])

    let ip_mac_db = get_mac_from_db()
    console.log("Goal State IP/MACs: " + JSON.stringify(ip_mac_db))
    return ip_mac_db
}

// simple test
export default function() {
<<<<<<< HEAD
    // let ip_mac = [{ "ip": "172.16.62.212", "mac": "a4:ae:12:79:c9:81" }, { "ip": "172.16.62.213", "mac": "a4:ae:12:79:5a:27" }]
    // create_test_setup(ip_mac)
    let service_port_map = get_service_port_map()
    get_subnets(service_port_map["snm"])
    get_nodes(service_port_map["nm"])
    get_vpcs(service_port_map["vpm"])
    get_ports(service_port_map["pm"])
}
=======
   let ip_mac = [{ "ip": "172.16.62.212", "mac": "a4:ae:12:79:c9:81" }, { "ip": "172.16.62.213", "mac": "a4:ae:12:79:5a:27" }]
   let res = create_test_setup(ip_mac)
}
>>>>>>> recent codes about k6
