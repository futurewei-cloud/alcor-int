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

import http from 'k6/http';
import { sleep } from 'k6';
import { get_alcor_services_info, get_service_port_map } from './alcor_services.js'
import * as create_test_setup from './create_test_setup.js'

// test_case is the scenario section header, must contain
// all of the subnet information. Different scenarios may use
// the same test_case setup so to avoid confusion, passin
// the scenario name which will appear in the test output.
function create_subnets(snm_port, test_case, scenario){
    console.log(`creating subnets for scenario ${scenario}`);
    let id_list = get_alcor_services_info(test_case,"subnet_ids")
    let id_names = get_alcor_services_info(test_case,"subnet_names")
    let device_ids = get_alcor_services_info(test_case,"device_ids")
    let cidrs  = get_alcor_services_info(test_case,"cidrs")
    let ip_addrs  = get_alcor_services_info(test_case,"ip_addrs")
    let subnetinfo = get_alcor_services_info("subnet_info","subnet_info")

    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/subnets`
    console.log("url: " + url)

    let length = Math.min(cidrs.length, id_list.length, id_names.length)
    let subnet = {} 
    for(let idx=0; idx<length; idx++){
        subnetinfo['cidr']=cidrs[idx]
        subnetinfo['id'] = id_list[idx]
        subnetinfo['name'] = id_names[idx]
        subnet["subnet"] = subnetinfo
        console.log(JSON.stringify(subnet))
        http.request('POST', url, JSON.stringify(subnet));
    }
    console.log("verifying created subnets")
    let res = http.get(url);
    console.log(JSON.stringify(res));
    console.log(`FINISH: created subnets for scenario ${scenario}`)
    return {"id_list":id_list,"device_ids":device_ids,"ip_addrs":ip_addrs}
}


function create_security_groups(port){
    console.log("Creating security groups")
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${port}/project/${projectid}/security-groups`
    console.log("url: " + url)

    let sginfo = get_alcor_services_info("security_groups","security_group_info")
    let id_list = get_alcor_services_info("L2_basic","security_group_ids")
    let id_names = get_alcor_services_info("L2_basic","sg_names")
    let device_ids = get_alcor_services_info("L2_basic","device_ids")

    let length = Math.min(device_ids.length, id_list.length, id_names.length)
    let security_groups ={}
    for(let idx=0; idx<length; idx++){
        sginfo['id'] = id_list[idx]
        sginfo['name'] = id_names[idx]
        security_groups["security_group"] = sginfo
        console.log("SG ", JSON.stringify(security_groups))
        http.request('POST', url, JSON.stringify(security_groups));
    }
    http.request('FINISH: creating security groups');
    return {"id_list":id_list,"device_ids":device_ids}
}
    
function attach_subnets_to_router(rm_port, snm_port, router_id, subnet_id_list){
    console.log("Attaching subnets to router")
    let projectid = get_alcor_services_info("test_setup", "project_id")
    let url = `http://localhost:${rm_port}/project/${projectid}/routers/${router_id}/add_router_interface`
    
    for(let id in subnet_id_list)
    {
        let subnet_info = {"subnet_id":id}
        http.put(url, JSON.stringify(subnet_info));
    }

    let req=`http://localhost:${rm_port}/project/${projectid}/routers`
    console.log("Attached router info")
    let res=http.get(req)
    console.log(JSON.stringify(res))
    console.log("FINISH: attaching subnets to router")
}


//  Test case 1: L2 Basic
//  Two nodes in same subnet in different seurity groups
function prepare_test_L2_basic(ip_mac, ser_port){
    let test_name = "L2_basic"
    console.log(`Preparing test case ${test_name}...`)
    
    create_test_setup.create_default_segment_table(ser_port["sgs"])
    create_test_setup.create_vpc(ser_port["vpm"])
    create_test_setup.create_node(ser_port["nm"], ip_mac)
    create_test_setup.create_subnet(ser_port["snm"])
    let res = create_security_groups(ser_port["sgm"])
    let id_list = res["id_list"]
    let device_ids =  res["device_ids"]
    let change_ports = {"change":["security_groups","device_id"], "security_groups":id_list,"device_ids":device_ids}
    create_port_goal_states(ser_port["pm"], change_ports)

}

    
    ip_mac_db = get_mac_from_db()
    print("Test case {}. IP/MAC in ignite DB: ".format(test_name, ip_mac_db))
    print("SUCCESS: preparing test case {}...".format(test_name))
    return ip_mac_db

    


    
// K6 test function
export default function () {
    // create_default_segment_table(1)
    // create_router_interface(2)
    let ip_mac = [{ "ip": "1.1.1.1", "mac": "123" }, { "ip": "2.2.2.2", "mac": "345" }]
    // create_node(3, ip_mac) 
    // create_router_interface(4)
    // create_vpc(5)
    // create_subnet(6)
    // create_security_group(7)
    // get_subnets(8)
    // get_nodes(9)
    // get_vpcs(10)
    // get_ports(11)
    // create_ports(12)
    create_test_setup(ip_mac)
}