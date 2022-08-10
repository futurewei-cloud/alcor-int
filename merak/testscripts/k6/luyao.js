import { sleep } from 'k6';
import { post_httprequest, get_httprequest, put_httprequest } from './prepare_payload.js'



export function uuid() {
  var s = []
  var hexDigits = '0123456789abcdef'
  for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'

  var uuid = s.join('')
  return uuid
}

function genMAC(){
  var hexDigits = '0123456789abcdef';
  var macAddress = "";
  for (var i = 0; i < 6; i++) {
      macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
      macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
      if (i != 5) macAddress += ":";
  }
  return macAddress;
}


//  Using vpc_manager (port 9001) create a default segment table for admin purposes
export function create_default_segment_table() {
    console.log("Create default segment table");
    let url = "http://localhost:9001/segments/createDefaultTable";
    sleep(3);
    post_httprequest(url)
    console.log("FINISH: Created default segment table\n");
}

// Using vpc_manager (port 9001), create a VPC
// project ID: 3dda2801-d675-4688-a63f-dcda8d327f50
// ID: 9192a4d4-ffff-4ece-b3f0-8d36e3d88001 (possibly network ID)
export function create_vpc() {
    console.log("Creating VPC\n")
    let network = {}
    let url = "http://localhost:9001/project/3dda2801-d675-4688-a63f-dcda8d327f50/vpcs"

    let network_info = {
        "admin_state_up": true,
        "revision_number": 0,
        "cidr": "10.0.0.0/16",
        "default": true,
        "description": "vpc",
        "dns_domain": "domain",
        "id": "9192a4d4-ffff-4ece-b3f0-8d36e3d88001",
        "is_default": true,
        "mtu": 1400,
        "name": "sample_vpc",
        "port_security_enabled": true,
        "project_id": "3dda2801-d675-4688-a63f-dcda8d327f50"
      }
    network["network"] = network_info
    sleep(3);
    post_httprequest(url, network);
    console.log("FINISH: Created VPC\n")
}

// { "ip": "172.16.62.212", "mac": "a4:ae:12:79:c9:81" }, { "ip": "172.16.62.213", "mac": "a4:ae:12:79:5a:27" }
// Node ID: 1112a4d4-ffff-4ece-b3f0-8d36e3d85001

var host_name = new Array()
var host_ip = new Array()
var host_mac = new Array()
var host_id = new Array()

export function host_init(){
  for(let i=0;i<50;i++){
    host_name.push(`node${i}`)
    host_ip[i]=`172.16.62.${i+10}`
    let mac_temp=genMAC()
    host_mac.push(mac_temp)
    let id_temp =""
    if(i<10){
      id_temp = `1112a4d4-ffff-4ece-b3f0-8d36e3d8500${i}`
    }
    else if(i<100){
      id_temp = `1112a4d4-ffff-4ece-b3f0-8d36e3d850${i}`
    }
    else{
      id_temp = `1112a4d4-ffff-4ece-b3f0-8d36e3d85${i}`
    }
    host_id.push(id_temp)
  }
  // console.log(JSON.stringify(host_name))
  // console.log(JSON.stringify(host_ip))
  // console.log(JSON.stringify(host_mac))
  // console.log(JSON.stringify(host_id))
}

export function create_nodes() {
    console.log("Creating nodes");
    let url = "http://localhost:9007/nodes";

    for (let i = 0; i < host_id.length; i++) {
      let data = {
        "host_info": {
          "local_ip": host_ip[i],
          "mac_address": host_mac[i],
          "node_id": host_id[i],
          "node_name": host_name[i],
          "server_port": 8080,
          "veth": "eth0"  
       }
      }
      sleep(3);
      post_httprequest(url, data);
    }
    console.log("FINISH: Created nodes\n")
}


// Using subnet manager (9002) to create subnet
// Subnet1 name: subnet1
// Subnet1 ID: 8182a4d4-ffff-4ece-b3f0-8d36e3d88001
export function create_subnet1() {
    console.log("Creating Subnet1\n")

    let url = "http://localhost:9002/project/3dda2801-d675-4688-a63f-dcda8d327f50/subnets"

    let data = {
      "subnet": {
        "cidr": "10.0.1.0/24",
        "id": "8182a4d4-ffff-4ece-b3f0-8d36e3d88001",
        "ip_version": 4,
        "network_id": "9192a4d4-ffff-4ece-b3f0-8d36e3d88001",
        "name": "subnet1",
        "host_routes": [
          {
            "destination": "10.0.2.0/24",
            "nexthop": "10.0.1.1"
          }
        ]
      }
    }
    post_httprequest(url, data)
    console.log("FINISH: Creating Subnet1\n")
}


// Subnet2 ID: 8182a4d4-ffff-4ece-b3f0-8d36e3d88002
// export function create_subnet2() {
//     console.log("Creating Subnet2\n")

//     let url = "http://localhost:9002/project/3dda2801-d675-4688-a63f-dcda8d327f50/subnets"

//     let data = {
//       "subnet": {
//         "cidr": "10.0.2.0/24",
//         "id": "8182a4d4-ffff-4ece-b3f0-8d36e3d88002",
//         "ip_version": 4,
//         "network_id": "9192a4d4-ffff-4ece-b3f0-8d36e3d88001",
//         "name": "subnet2",
//         "host_routes": [
//           {
//             "destination": "10.0.1.0/24",
//             "nexthop": "10.0.2.1"
//           }
//         ]
//       }
//     }
//     post_httprequest(url, data)
//     console.log("FINISH: Creating Subnet2\n")
// }




// Using route manager (port 9002)
// export function create_route() {
//     console.log("Creating Router\n")

//     let url = "http://localhost:9003/project/3dda2801-d675-4688-a63f-dcda8d327f50/routers"

//     let data={
//       "router": {
//         "admin_state_up": true,
//         "availability_zone_hints": [
//           "string"
//         ],
//         "availability_zones": [
//           "string"
//         ],
//         "conntrack_helpers": [
//           "string"
//         ],
//         "description": "string",
//         "distributed": true,
//         "external_gateway_info": {
//           "enable_snat": true,
//           "external_fixed_ips": [
//           ],
//           "network_id": "9192a4d4-ffff-4ece-b3f0-8d36e3d88001"
//         },
//         "flavor_id": "string",
//         "gateway_ports": [
//         ],
//         "ha": true,
//         "id": "11112801-d675-4688-a63f-dcda8d327f50",
//         "name": "router1",
//         "owner": "9192a4d4-ffff-4ece-b3f0-8d36e3d88001",
//         "project_id": "3dda2801-d675-4688-a63f-dcda8d327f50",
//         "revision_number": 0,
//         "routetable": {
//         },
//         "service_type_id": "string",
//         "status": "BUILD",
//         "tags": [
//           "string"
//         ],
//         "tenant_id": "3dda2801-d675-4688-a63f-dcda8d327f50"
//       }
//     }
//     post_httprequest(url, data)
//     console.log("FINISH: Creating Router\n")
// }


// export function attach_subnets_to_router()
// {
//   console.log("Attach Subnets to Router\n")

//   let url = "http://10.213.43.161:9003/project/3dda2801-d675-4688-a63f-dcda8d327f50/routers/11112801-d675-4688-a63f-dcda8d327f50/add_router_interface";
//   let data = {
//     "subnet_id": "8182a4d4-ffff-4ece-b3f0-8d36e3d88001"
//   }
//   put_httprequest(url, data)

//   sleep(3);

//   url = "http://10.213.43.161:9003/project/3dda2801-d675-4688-a63f-dcda8d327f50/routers/11112801-d675-4688-a63f-dcda8d327f50/add_router_interface";

//   data = {
//     "subnet_id": "8182a4d4-ffff-4ece-b3f0-8d36e3d88002"
//   }
//   put_httprequest(url, data)
//   console.log("FINISH: Attach Subnets to Router\n")

// }




// Security Group (port 9008)
let sg_id = ["3dda2801-d675-4688-a63f-dcda8d111111","3dda2801-d675-4688-a63f-dcda8d111112","3dda2801-d675-4688-a63f-dcda8d111113","3dda2801-d675-4688-a63f-dcda8d111114"]
let sg_name = ["sg1","sg2","sg3","sg4"]
export function create_security_group()
{
  console.log("Creating Security Group\n")
  let url = "http://localhost:9008/project/3dda2801-d675-4688-a63f-dcda8d327f50/security-groups";
  for (let i = 0; i < sg_id.length; i++) {
    let data= {
      "security_group": {
        "create_at": "string",
        "description": "string",
        "id": sg_id[i],
        "name": sg_name[i],
        "project_id": "3dda2801-d675-4688-a63f-dcda8d327f50",
        "security_group_rules": [
        ],
        "tenant_id": "3dda2801-d675-4688-a63f-dcda8d327f50",
        "update_at": "string"
      }
    }
    sleep(3);
    post_httprequest(url, data)
    console.log("FINISH: Creating Security Group\n")
  }
}

// Using Port manager, create the end port:
// Ensure your IPs are within the subnet you created (line 119)
// IP, name and ID should be unique for eqach request
// Ensure to use same security group ID 3dda2801-d675-4688-a63f-dcda8d111111




// let subnet_ids = ["8182a4d4-ffff-4ece-b3f0-8d36e3d88001","8182a4d4-ffff-4ece-b3f0-8d36e3d88002"]



// let device_id = ["8182a4d4-ffff-4ece-b3f0-8d36e3d00001","8182a4d4-ffff-4ece-b3f0-8d36e3d00002","8182a4d4-ffff-4ece-b3f0-8d36e3d00003","8182a4d4-ffff-4ece-b3f0-8d36e3d00001","8182a4d4-ffff-4ece-b3f0-8d36e3d00002","8182a4d4-ffff-4ece-b3f0-8d36e3d00003"]

// let device_id = ["8182a4d4-ffff-4ece-b3f0-8d36e3d00001","8182a4d4-ffff-4ece-b3f0-8d36e3d00002","8182a4d4-ffff-4ece-b3f0-8d36e3d00003","8182a4d4-ffff-4ece-b3f0-8d36e3d00004","8182a4d4-ffff-4ece-b3f0-8d36e3d00005","8182a4d4-ffff-4ece-b3f0-8d36e3d00006"]
// let device_id = ["8182a4d4-ffff-4ece-b3f0-8d36e3d00001","8182a4d4-ffff-4ece-b3f0-8d36e3d00002"]


// let ip_addrs = ["10.0.1.101","10.0.1.102","10.0.1.103","10.0.2.201","10.0.2.202","10.0.2.203"]
// let ip_addrs = ["10.0.1.101","10.0.1.102","10.0.1.103","10.0.1.104","10.0.1.105","10.0.1.106"]
// let ip_addrs = ["10.0.1.301","10.0.1.302"]


// let port_id = ["7172a4d4-ffff-4ede-b3ml0-8d36e3d00101","7172a4d4-ffff-4ede-b3ml0-8d36e3d00102","7172a4d4-ffff-4ede-b3ml0-8d36e3d00103","7172a4d4-ffff-4ede-b3ml0-8d36e3d00201","7172a4d4-ffff-4ede-b3ml0-8d36e3d00202","7172a4d4-ffff-4ede-b3ml0-8d36e3d00203"]
// let port_id = ["7172a4d4-ffff-4ede-b3ml0-8d36e3d00301","7172a4d4-ffff-4ede-b3ml0-8d36e3d00302"]


// let port_name = ["port101","port102","port103","port201","port202","port203"]
// let port_name = ["port301","port302"]

var port_name = new Array()
var port_id = new Array()
var ip_addrs = new Array()

export function port_init(){
  for(let i=0;i<250;i++){
    port_name.push(`port${i}`)
    ip_addrs[i]=`10.0.1.${i+2}`
    let id_temp =""
    if(i<10){
      id_temp = `7172a4d4-ffff-4ede-b3ml0-8d36e3d00${i}`
    }
    else if(i<100){
      id_temp = `7172a4d4-ffff-4ede-b3ml0-8d36e3d0${i}`
    }
    else{
      id_temp = `7172a4d4-ffff-4ede-b3ml0-8d36e3d${i}`
    }
    port_id.push(id_temp)
  }
  // console.log(JSON.stringify(port_name))
  // console.log(JSON.stringify(port_id))
  // console.log(JSON.stringify(ip_addrs))
}


export function create_port(){
  let url =  "http://localhost:9006/project/3dda2801-d675-4688-a63f-dcda8d327f50/ports";
  for (let i = 0; i < port_id.length; i++) {
    let j = i % host_id.length;
    let k = i % sg_id.length;
    let device_id_temp = uuid()
    let data = {
      "port": {
        "admin_state_up" : true,
        "allowed_address_pairs": [
          {
            "ip_address": "11.11.11.1",
            "mac_address": "00-AA-BB-15-EB-3F"
          }
        ],
        "binding:host_id": host_name[j],
        "binding:vif_details": {},
        "create_at": "string",
        "description": "string",
        "device_id": device_id_temp,
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
            "ip_address": ip_addrs[i],
            "subnet_id": "8182a4d4-ffff-4ece-b3f0-8d36e3d88001"
          }
        ],
        "id": port_id[i],
        "mac_learning_enabled": true,
        "name": port_name[i],
        "network_id": "9192a4d4-ffff-4ece-b3f0-8d36e3d88001",
        "network_ns": "string",
        "port_security_enabled": true,
        "project_id": "3dda2801-d675-4688-a63f-dcda8d327f50",
        "qos_network_policy_id": "string",
        "qos_policy_id": "string",
        "revision_number": 0,
        "security_groups": [
          sg_id[k]
        ],
        "tags": [
          "string"
        ],
        "tenant_id": "3dda2801-d675-4688-a63f-dcda8d327f50",
        "update_at": "string",
        "uplink_status_propagation": true,
        "veth_name": "string"
      }
    }
    sleep(3);
    post_httprequest(url, data)
  }

  console.log("FINISH: Create Port\n")
}





// 比如在一个VPC中，有几百个虚机，每次给10分之一的虚机下发port，在同一子网。最后下发4个安全组，安全组就跨子网地随机选一些虚机。

export const options = {
  scenarios: {
    scenario: {
      executor: 'shared-iterations',
      maxDuration: '200m',
    },
  },
};

export default function () {
  create_default_segment_table();
  create_vpc()
  host_init()
  create_nodes()
  create_subnet1()
  create_security_group()
  port_init()
  create_port()
}
