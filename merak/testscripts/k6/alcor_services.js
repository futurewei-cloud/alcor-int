var alcor_services = {}

// [services]
alcor_services["services"] = {}
alcor_services["services"]["ignite"] = {
    "name": "ignite",
    "port": 10800,
    "path": "/lib/ignite.Dockerfile"
}
// vpc_manager internal port : 9001
alcor_services["services"]["vpc_manager"] = { "name": "vpm", "port": 9009 }

// Segment handling can't be routed through API gateway but has to go
// directly to vpc_manager but other vpc related requests will have to
// go through API gateway. A segment_service is added as an alias of
// vpc_manager internal port for handling this situation. At present, ping
// test uses it to create default segment table.
alcor_services["services"]["segment_service"] = { "name": "sgs", "port": 9001 }

// subnet_manager internal port : 9002
alcor_services["services"]["subnet_manager"] = { "name": "snm", "port": 9009 }

// route_manager internal port : 9003
alcor_services["services"]["route_manager"] = { "name": "rm", "port": 9009 }

// private_ip_manager internal port : 9004
alcor_services["services"]["private_ip_manager"] = { "name": "pim", "port": 9009 }

// mac_manager (virtual mac manager) internal port : 9005
alcor_services["services"]["mac_manager"] = { "name": "mm", "port": 9009 }

// port_manager internal port : 9006
alcor_services["services"]["port_manager"] = { "name": "pm", "port": 9009 }

// This can't be routed through API GW
alcor_services["services"]["node_manager"] = { "name": "nm", "port": 9007 }

// security_group_manager internal port : 9008
alcor_services["services"]["security_group_manager"] = { "name": "sgm", "port": 9009 }

alcor_services["services"]["api_gateway"] = { "name": "ag", "port": 9009 }

// data_plane_manager internal port : 9010
alcor_services["services"]["data_plane_manager"] = { "name": "dpm", "port": 9009 }

// elastic_ip_manager internal port : 9011
alcor_services["services"]["elastic_ip_manager"] = { "name": "eim", "port": 9009 }

// quota_manager internal port : 9012
alcor_services["services"]["quota_manager"] = { "name": "qm", "port": 9009 }

// network_acl_manager internal port : 9013
alcor_services["services"]["network_acl_manager"] = { "name": "nam", "port": 9009 }

// network_config_manager internal port : 9014
alcor_services["services"]["network_config_manager"] = { "name": "ncm", "port": 9009 }

// gateway_manager internal port : 9015
alcor_services["services"]["gateway_manager"] = { "name": "gm", "port": 9009 }

// [AlcorControlAgents]
alcor_services["AlcorControlAgents"] = {}
alcor_services["AlcorControlAgents"]["node1"] = "172.31.19.133"
alcor_services["AlcorControlAgents"]["node2"] = "172.31.21.202"

// [test_setup]
alcor_services["test_setup"] = {}
alcor_services["test_setup"]["vpc_id"] = "9192a4d4-ffff-4ece-b3f0-8d36e3d88001"
alcor_services["test_setup"]["project_id"] = "3dda2801-d675-4688-a63f-dcda8d327f50"
alcor_services["test_setup"]["tenant_id"] = "3dda2801-d675-4688-a63f-dcda8d327f50"
alcor_services["test_setup"]["network_id"] = "9192a4d4-ffff-4ece-b3f0-8d36e3d88001"
alcor_services["test_setup"]["cidr"] = "172.16.0.0/16"
alcor_services["test_setup"]["node_id"] = [
    "1112a4d4-ffff-4ece-b3f0-8d36e3d85001",
    "1112a4d4-ffff-4ece-b3f0-8d36e3d85002"
]
alcor_services["test_setup"]["node_name"] = ["node1", "node2"]
alcor_services["test_setup"]["subnet_id"] = "8182a4d4-ffff-4ece-b3f0-8d36e3d88001"
alcor_services["test_setup"]["security_group_id"] = "3dda2801-d675-4688-a63f-dcda8d111111"
alcor_services["test_setup"]["device_id"] = [
    "8182a4d4-ffff-4ece-b3f0-8d36e3d00001",
    "8182a4d4-ffff-4ece-b3f0-8d36e3d00002"
]
alcor_services["test_setup"]["port_name"] = ["port101", "port102"]
alcor_services["test_setup"]["port_id"] = [
    "7122a4d4-ffff-5eee-b3f0-8d36e3d01101",
    "7122a4d4-ffff-5eee-b3f0-8d36e3d02201"
]
alcor_services["test_setup"]["ip_addrs"] = ["172.16.1.101", "172.16.1.102"]
alcor_services["test_setup"]["container_names"] = ["con1", "con2"]

// [L3_AttachRouter_then_CreatePorts]
alcor_services["L3_AttachRouter_then_CreatePorts"] = {}
alcor_services["L3_AttachRouter_then_CreatePorts"]["subnet_ids"] = [
    "8182a4d4-ffff-4ece-b3f0-8d36e3d88001",
    "8182a4d4-ffff-4ece-b3f0-8d36e3d88002"
]
alcor_services["L3_AttachRouter_then_CreatePorts"]["cidrs"] = [
    "172.16.1.0/24",
    "172.16.2.0/24"
]
alcor_services["L3_AttachRouter_then_CreatePorts"]["ip_addrs"] = [
    "172.16.1.101",
    "172.16.2.201"
]
alcor_services["L3_AttachRouter_then_CreatePorts"]["subnet_names"] = [
    "subnet1",
    "subnet2"
]
alcor_services["L3_AttachRouter_then_CreatePorts"]["device_ids"] = [
    "8182a4d4-ffff-4ece-b3f0-8d36e3d00001",
    "8182a4d4-ffff-4ece-b3f0-8d36e3d00002"
]

// [L2_basic]
alcor_services["L2_basic"] = {}
alcor_services["L2_basic"]["security_group_ids"] = [
    "3dda2801-d675-4688-a63f-dcda8d111111",
    "3dda2801-d675-4688-a63f-dcda8d111112"
]
alcor_services["L2_basic"]["sg_names"] = ["sg1", "sg2"]
alcor_services["L2_basic"]["device_ids"] = [
    "8182a4d4-ffff-4ece-b3f0-8d36e3d00001",
    "8182a4d4-ffff-4ece-b3f0-8d36e3d00002"
]

// [gateways]
alcor_services["gateways"] = {}
alcor_services["gateways"]["gateway_info"] = [
    { "gw": "172.16.1.1", "ips": ["172.16.1.101", "172.16.1.102"] },
    { "gw": "172.16.2.1", "ips": ["172.16.2.201"] }
]

// [vpc_info]
alcor_services["vpc_info"] = {}
alcor_services["vpc_info"]["vpc_info"] = {
    "cidr": alcor_services["test_setup"]["cidr"],
    "id": alcor_services["test_setup"]["vpc_id"],
    "project_id": alcor_services["test_setup"]["project_id"]
}

// [node_info]
alcor_services["node_info"] = {}
alcor_services["node_info"]["node_info"] = {
    "node_id": alcor_services["test_setup"]["node_id"],
    "node_name": alcor_services["test_setup"]["node_name"],
    "server_port": 8080,
    "veth": "eth0"
}

// [subnet_info]
alcor_services["subnet_info"] = {}
alcor_services["subnet_info"]["subnet_info"] = {
    "cidr": alcor_services["test_setup"]["cidr"],
    "id": alcor_services["test_setup"]["subnet_id"],
    "ip_version": 4,
    "network_id": alcor_services["test_setup"]["network_id"],
    "name": "subnet1",
    "host_routes": [
        {
            "destination": "172.16.1.0/24",
            "nexthop": "172.16.1.1"
        }
    ]
}

// [security_groups]
alcor_services["security_groups"] = {}
alcor_services["security_groups"]["security_group_info"] = {
    "create_at": "string",
    "description": "string",
    "id": alcor_services["test_setup"]["security_group_id"],
    "name": "sg1",
    "project_id": alcor_services["test_setup"]["project_id"],
    "security_group_rules": [],
    "tenant_id": alcor_services["test_setup"]["tenant_id"],
    "update_at": "string"
}

// [port_info]
alcor_services["port_info"] = {}
alcor_services["port_info"]["port_info"] = {
    "binding:host_id": alcor_services["test_setup"]["node_name"],
    "device_id": alcor_services["test_setup"]["device_id"],
    "fixed_ips": alcor_services["test_setup"]["ip_addrs"],
    "subnet_id": alcor_services["test_setup"]["subnet_id"],
    "id": alcor_services["test_setup"]["port_id"],
    "name": alcor_services["test_setup"]["port_name"],
    "network_id": alcor_services["test_setup"]["network_id"],
    "project_id": alcor_services["test_setup"]["project_id"],
    "security_groups": alcor_services["test_setup"]["security_group_id"],
    "tenant_id": alcor_services["test_setup"]["tenant_id"]
}

// [router_info]
alcor_services["router_info"] = {}
alcor_services["router_info"]["router_info"] = {
    "name": "router1",
    "owner": alcor_services["test_setup"]["vpc_id"],
    "network_id": alcor_services["test_setup"]["network_id"],
    "project_id": alcor_services["test_setup"]["project_id"],
    "security_groups": alcor_services["test_setup"]["security_group_id"],
    "tenant_id": alcor_services["test_setup"]["tenant_id"],
    "id": "11112801-d675-4688-a63f-dcda8d327f50"
}



export function get_alcor_services_info(key1, key2) {
    if (alcor_services.hasOwnProperty(key1)) {
        if (alcor_services[key1].hasOwnProperty(key2)) {
            return alcor_services[key1][key2]
        }
        else {
            return "key2 none"
        }
    }
    else {
        return "key1 none"
    }
}

export function get_service_port_map() {
    let service_list = {}
    if (alcor_services.hasOwnProperty("services")) {
        for(let service_name in alcor_services["services"])
        {
            let service_info = alcor_services["services"][service_name]
            service_list[service_info["name"]] = service_info["port"]
        }
    }
    // console.log("service_list: " + JSON.stringify(service_list))
    return service_list
}