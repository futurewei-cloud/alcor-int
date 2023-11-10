/*
MIT License
Copyright(c) 2020 Futurewei Cloud
    Permission is hereby granted,
    free of charge, to any person obtaining a copy of this software and associated documentation files(the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and / or sell copies of the Software, and to permit persons
    to whom the Software is furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
    This is the code testing the Alcor HTTP APIs, currently support APIs:
    1. createVPC
    2. createSubnet
    3. createPort

    Params:
    1. vpm_ip
    2. vpm_port
    3. snm_ip
    4. snm_port
    5. pm_ip
    6. pm_port
    7. vpc_cidr_slash
    8. tenant_amount
    9. project_amount_per_tenant
    10. vpc_amount_per_project
    11. subnet_amount_per_vpc
    12. test_vpc_api = true
    13. test_subnet_api = true
    14. test_port_api = true
    15. call_api_rate = 100

    the number of ports will be based on the vpc_cidr_slash and subnet_amount_per_vpc, for example, if vpc_cidr_slash
    is 8, then the network cidr becomes 10.0.0.0/8, which has 2^(32-8) IPs, and say we have subnet_amount_per_vpc = 1024,
    which is 2^10, then each subnet will have 2^(32-8-10) = 16384 ports, minus the two IPs(first and last in subnet cidr)
    reserved by Alcor.
*/

import { sleep } from "k6";
import {
    get_alcor_services_info,
    get_service_port_map,
} from "./alcor_services.js";
import {
    put_httprequest,
    post_httprequest,
    get_httprequest,
    get_mac_from_db,
} from "./prepare_payload.js";
import * as helper_functions from "./helper_functions.js";
import { FormElement } from "k6/html";

var vpm_ip = get_alcor_services_info("TC", "vpm_ip");
var vpm_port = get_alcor_services_info("TC", "vpm_ip");
var snm_ip = get_alcor_services_info("TC", "snm_ip");
var snm_port = get_alcor_services_info("TC", "snm_port");
var pm_ip = get_alcor_services_info("TC", "pm_ip");
var pm_port = get_alcor_services_info("TC", "pm_port");

/*
    vpc_cidr_slash, the number after the slash in the vpc CIDR, 
    decides how big the VPC is, such as 10.0.0.0/16 or 10.0.0.0/8.
*/
var vpc_cidr_slash = get_alcor_services_info("TC", "vpc_cidr_slash");

/*
   tenant_amount = concurrency when calling APIs.
*/
var tenant_amount = get_alcor_services_info("TC", "tenant_amount");

/*
    project_amount_per_tenant, each tenant can have multiple projects.
*/
var project_amount_per_tenant = get_alcor_services_info(
    "TC",
    "project_amount_per_tenant"
);

/*
    vpc_amount_per_project, each project can have multiple VPCs.
    each VPC can have the same CIDR
*/
var vpc_amount_per_project = get_alcor_services_info(
    "TC",
    "vpc_amount_per_project"
);

/*
    subnet_amount_per_vpc, each VPC can have multiple subnets.
*/
var subnet_amount_per_vpc = get_alcor_services_info(
    "TC",
    "subnet_amount_per_vpc"
);

var test_vpc_api = get_alcor_services_info("TC", "test_vpc_api");
var test_subnet_api = get_alcor_services_info("TC", "test_subnet_api");
var test_port_api = get_alcor_services_info("TC", "test_port_api");
var call_api_rate = get_alcor_services_info("TC", "call_api_rate");

export function run_test_against_alcor_apis() {
    console.log(
        "Beginning of alcor API test, need to generate: " +
        tenant_amount +
        " tenants, \n" +
        project_amount_per_tenant +
        " projects for each tenant, \n" +
        vpc_amount_per_project +
        " VPCs for each project, \n" +
        subnet_amount_per_vpc +
        " subnets for each VPC, \n"
    );

    let tenant_uuids = [];
    let tenant_projects = {};
    let project_vpcs = {};
    let vpc_subnets = {};
    let subnet_ports = {};
    let vpc_port_ips = [];
    let subnet_port_amount = 1;

    for (let i = 0; i < tenant_amount; i++) {
        let current_tenant_uuid = helper_functions.uuid();
        tenant_uuids.push(current_tenant_uuid);
        let current_tenant_projects = [];
        for (let j = 0; j < project_amount_per_tenant; j++) {
            let current_project_id = helper_functions.uuid();
            current_tenant_projects.push(current_project_id);
            let vpcs_inside_a_project = [];
            for (let k = 0; k < vpc_amount_per_project; k++) {
                /*
                            If you set it to /8 you will get a out-of-memory error.
                            /12 gives you more than 2 ^ 20 ports in a VPC, which is
                            1,048,576, without causing the out-of-memory error.
                        */
                let vpc_cidr = "10.0.0.0/" + String(vpc_cidr_slash);
                let current_vpc_id = helper_functions.uuid();
                let network = {
                    admin_state_up: true,
                    revision_number: 0,
                    cidr: vpc_cidr,
                    default: true,
                    description: "vpc-" + String(k),
                    dns_domain: "test-dns-domain",
                    id: current_vpc_id,
                    is_default: true,
                    mtu: 1400,
                    name: "vpc-" + String(k),
                    port_security_enabled: true,
                    project_id: current_project_id,
                };
                let vpc_payload = { network: network };
                vpcs_inside_a_project.push(vpc_payload);

                /*
                            1. Generate all port IPs from VPC CIDR range.
                            2. Divide port IPs into groups based on subnet_amount_per_vpc;
                            3. Each group is a subnet, calculate subnet CIDR and form its subnet payload and ports payload
                        */
                if (vpc_port_ips.length == 0) {
                    try {
                        console.log("Need to generate port IPs for the first time.");
                        vpc_port_ips = get_cidr_network_address_range(vpc_cidr);
                        subnet_port_amount = vpc_port_ips.length / subnet_amount_per_vpc;
                        console.log(
                            "Finished generating port IPs. Each subnet should have " +
                            String(subnet_port_amount) +
                            " ports"
                        );
                    } catch (err) {
                        console.log(JSON.stringify(err));
                    }
                }
                /*
                            Create subnet payload based on vpc payload
                        */
                if (test_subnet_api && vpc_port_ips.length != 0) {
                    let current_vpc_subnets = [];
                    console.log("Generating subnets");

                    for (let l = 0; l < subnet_amount_per_vpc; l++) {
                        // let subnet_start_ip = vpc_port_ips[(l * subnet_port_amount) + 0]
                        // let subnet_end_ip = vpc_port_ips[(l * subnet_port_amount) + subnet_port_amount - 1]
                        let subnet_range = vpc_port_ips.slice(
                            l * subnet_port_amount + 0,
                            l * subnet_port_amount + subnet_port_amount
                        );
                        let subnet_cidr = subnet_range[0];
                        let current_subnet_id = helper_functions.uuid();
                        let subnet = {
                            cidr: subnet_cidr,
                            id: current_subnet_id,
                            ip_version: 4,
                            network_id: current_vpc_id,
                            name: "subnet" + l,
                        };
                        let subnet_payload = { subnet: subnet };
                        current_vpc_subnets.push(subnet_payload);

                        if (test_port_api) {
                            let subnet_port_ips = vpc_port_ips.slice(
                                l * subnet_port_amount + 0,
                                l * subnet_port_amount + subnet_port_amount
                            );
                            let current_subnet_ports = [];
                            for (let port_ip_in_subnet in subnet_port_ips) {
                                let subnet_fixed_ip = {
                                    ip_address: port_ip_in_subnet,
                                    subnet_id: current_subnet_id,
                                };
                                let fixed_ips = [subnet_fixed_ip];

                                let port = {
                                    admin_state_up: true,
                                    description: "test_port",
                                    device_id: "test_device_id",
                                    device_owner: "compute:nova",
                                    fast_path: true,
                                    fixed_ips: fixed_ips,
                                    id: helper_functions.uuid(),
                                    mac_learning_enabled: true,
                                    network_id: current_vpc_id,
                                    securi_enabled: true,
                                    project_id: current_project_id,
                                    revision_number: 0,
                                    tenant_id: current_tenant_uuid,
                                    uplink_status_propagation: true,
                                };
                                let port_payload = { port: port };
                                current_subnet_ports.push(port_payload);
                            }
                            subnet_ports[current_subnet_id] = current_subnet_ports;
                        }
                    }
                    console.log("Finished generating subnets for vpc.");
                    vpc_subnets[current_vpc_id] = current_vpc_subnets;
                }
            }
            project_vpcs[current_project_id] = vpcs_inside_a_project;
        }
        tenant_projects[current_tenant_uuid] = current_tenant_projects;
    }

    if (test_vpc_api) {
        console.log("Time to test VPC API!");
        // let create_vpc_jobs = helper_functions.cloneObj(project_vpcs)
        let create_vpc_jobs = [];
        for (let project_id in project_vpcs) {
            for (let project_id_id in project_vpcs[project_id]) {
                create_vpc_jobs.push(project_vpcs[project_id][project_id_id]);
            }
        }
        // console.log(JSON.stringify(create_vpc_jobs))

        for (let vpc_job in create_vpc_jobs) {
            // console.log(JSON.stringify(create_vpc_jobs[vpc_job]))
            let current_project_id =
                create_vpc_jobs[vpc_job]["network"]["project_id"];
            // console.log("==========")
            let create_vpc_url =
                "http://" +
                vpm_ip +
                ":" +
                vpm_port +
                "/project/" +
                current_project_id +
                "/vpcs";
            let create_vpc_response = post_httprequest(create_vpc_url, vpc_job);
            if (
                null != create_vpc_response &&
                create_vpc_response.hasOwnProperty("network")
            ) {
                console.log("Created VPC successfully");
            }
        }
        if (test_subnet_api || test_port_api) {
            /*
                      If we are testing subnet API or port API, we need to wait until the VPC is created.
                  */
            sleep(600);
        } else {
            /* we actually don't need to wait latch_wait_seconds
                      because if we start the wait after the last call, we should actually wait for the last call.
                      So we will be waiting only 1 second at most.
                  */
            sleep(1);
        }
    }

    if (test_subnet_api) {
        console.log("Time to test subnet API!");
        // let create_subnet_jobs = helper_functions.cloneObj(vpc_subnets)
        let create_subnet_jobs = [];
        // console.log("=============")
        // console.log(JSON.stringify(vpc_subnets))
        for (let vpc_id in vpc_subnets) {
            for (let vpc_id_id in vpc_subnets[vpc_id]) {
                create_subnet_jobs.push(vpc_subnets[vpc_id][vpc_id_id]);
            }
        }

        for (let subnet_job in create_subnet_jobs) {
            let create_subnet_url =
                "http://" +
                snm_ip +
                ":" +
                snm_port +
                "/project/" +
                current_project_id +
                "/subnets";
            let create_vpc_response = post_httprequest(create_subnet_url, subnet_job);
            if (
                null != create_vpc_response &&
                create_vpc_response.hasOwnProperty("subnet")
            ) {
                console.log("Created VPC successfully");
            }
        }

        if (test_port_api) {
            /*
                If we are testing port API, we need to wait until the VPC is created.
            */
            sleep(600);
        } else {
            /* we actually don't need to wait latch_wait_seconds
                because if we start the wait after the last call, we should actually wait for the last call.
                So we will be waiting only 1 second at most.
            */
            sleep(1);
        }
    }

    if (test_port_api) {
        console.log("Time to test port API!");
        // let create_port_jobs = helper_functions.cloneObj(subnet_ports);
        // for (let subnet_id in create_port_jobs) {
        //     current_subnet_ports[subnet_id].pop();
        //     current_subnet_ports[subnet_id].shift();
        // }

        let create_port_jobs = []
        for (let subnet_id in subnet_ports) {
            let current_subnet_ports = subnet_ports[subnet_id]
            current_subnet_ports.pop()
            current_subnet_ports.shift()
            for (let subnet_id_id in current_subnet_ports) {
                create_port_jobs.push(current_subnet_ports[subnet_id_id])
            }
        }

        for (let port_job in create_port_jobs) {
            let current_project_id = port_job["port"]["project_id"];
            let create_port_url =
                "http://" +
                pm_ip +
                ":" +
                pm_port +
                "/project/" +
                current_project_id +
                "/ports";
            let create_vpc_response = post_httprequest(create_port_url, port_job);
            if (
                null != create_vpc_response &&
                create_vpc_response.hasOwnProperty("port")
            ) {
                console.log("Created VPC successfully");
            }
        }
        sleep(1);
    }
}

// K6 test function
export default function() {
    let res = run_test_against_alcor_apis();
}