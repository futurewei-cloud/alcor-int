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
    console.log("in")
    for (var i = 0; i < 6; i++) {
        macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
        macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
        if (i != 5) macAddress += ":";
    }
    return macAddress;
}

// Verify the regularity of IP
var ip_reg = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Verify the regularity of the subnet mask
var mask_reg = /^(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/;

/***　Convert IP address to binary format
 *　　@param string   ip    IP address to be converted
 */
export function ip_to_binary(ip) {
    if (ip_reg.test(ip)) {
        let ip_str = ""
        let ip_arr = ip.split(".")

        for (var i = 0; i < 4; i++) {
            let curr_num = ip_arr[i];
            let number_bin = parseInt(curr_num);
            number_bin = number_bin.toString(2);
            let count = 8 - number_bin.length;
            for (var j = 0; j < count; j++) {
                number_bin = "0" + number_bin;
            }
            ip_str += number_bin;
        }
        return ip_str;
    }

    return '';
}

/***　　Convert binary format to IP address
 *   　@param string   binary    Binary to be converted　　
 */
export function binary_to_ip(binary) {
    if (binary.length == 32) {
        let a = parseInt(binary.substr(0, 8), 2);
        let b = parseInt(binary.substr(8, 8), 2);
        let c = parseInt(binary.substr(16, 8), 2);
        let d = parseInt(binary.slice(-8), 2);

        return a + '.' + b + '.' + c + '.' + d;
    }

    return '';
}


/***  Calculate the network address and broadcast address 
 *    according to the subnet mask and gateway
 *    @param  string    ip
 *　　@param  string    mask    
 */
export function get_network_broadcast_addr(ip, mask) {
    let network_broadcast = {};
    let network_addr = "";

    let mask_arr = mask.split(".");
    let ip_arr = ip.split(".");

    // Calculate the network address
    for (var i = 0; i < 4; i++) {
        let number1 = parseInt(mask_arr[i]);
        let number2 = parseInt(ip_arr[i]);
        network_addr += number1 & number2;
        if (i < 3) {
            network_addr += ".";
        }
    }
    network_broadcast["network_addr"] = network_addr;

    // Calculate broadcast address
    let mask_binary = ip_to_binary(mask);
    let gateway_binary = ip_to_binary(ip);

    let mask_zero = mask_binary.split(0).length - 1;
    let one_number = new Array(mask_zero + 1).join('1'); // IP地址后位补1
    let broadcast_binary = gateway_binary.slice(0, -mask_zero) + one_number;

    network_broadcast["broadcast_addr"] = binary_to_ip(broadcast_binary);

    return network_broadcast;
}

//  Full Permutation and combination algorithm
function doExchange(doubleArrays) {
    let len = doubleArrays.length;
    if (len >= 2) {
        let len1 = doubleArrays[0].length;
        let len2 = doubleArrays[1].length;
        let newlen = len1 * len2;
        let temp = new Array(newlen);
        let index = 0;
        for (let i = 0; i < len1; i++) {
            for (let j = 0; j < len2; j++) {
                temp[index] = doubleArrays[0][i] + '.' + doubleArrays[1][j];
                index++;
            }
        }

        let newArray = new Array(len - 1);
        for (let i = 2; i < len; i++) {
            newArray[i - 1] = doubleArrays[i];
        }
        newArray[0] = temp;

        return doExchange(newArray);

    } else {
        return doubleArrays[0];
    }
}

/***　Obtain all IP combinations composed of network address and broadcast address
 *　　@param  string    network_addr    
 *　　@param  string    broadcast_addr  
 *　　@param  string    gateway
 */
export function return_ip(network_addr, broadcast_addr, gateway) {
    let range = [];
    let start = network_addr.split(".");
    let end = broadcast_addr.split(".");

    for (let i = 0; i < 4; i++) {
        if (start[i] == end[i]) {
            range[i] = [start[i]];
        } else {
            let min = Math.min(start[i], end[i]);
            let max = Math.max(start[i], end[i]);
            let temp = [];
            for (let j = min; j <= max; j++) {
                temp.push(j);
            }
            range[i] = temp;
        }
    }

    let ip_list = doExchange(range);

    // ip_list.shift(); // Remove network address
    // ip_list.pop(); // Remove broadcast address
    // let gateway_index = -1;

    // // Remove gateway
    // for (let k = 0; k < ip_list.length; k++) {
    //     if (ip_list[k] == gateway) {
    //         gateway_index = k;
    //         break;
    //     }
    // }
    // if (gateway_index > -1) {
    //     ip_list.splice(gateway_index, 1);
    // }

    // //Remove
    // let localhost_index = -1;
    // for (let k = 0; k < ip_list.length; k++) {
    //     if (ip_list[k] == "127.0.0.1") {
    //         localhost_index = k;
    //         break;
    //     }
    // }
    // if (localhost_index > -1) {
    //     ip_list.splice(localhost_index, 1);
    // }

    // //Remove 0.0.0.0
    // let all_zero_index = -1;
    // for (let k = 0; k < ip_list.length; k++) {
    //     if (ip_list[k] == "0.0.0.0") {
    //         all_zero_index = k;
    //         break;
    //     }
    // }
    // if (all_zero_index > -1) {
    //     ip_list.splice(all_zero_index, 1);
    // }

    return ip_list;
}

/***　Obtain all IP combinations composed of network address and broadcast address
 *　　@param  string    cidr_network_addr   
 */
export function get_cidr_network_address_range(cidr_network_addr) {
    let network_address = cidr_network_addr.split("/")[0];
    // console.log("network_address: " + network_address + " " + typeof (network_address))
    let mask_len = Number(cidr_network_addr.split("/")[1]);
    // console.log("mask_len: " + mask_len + " " + typeof (mask_len))
    let mask_binary = ""
    for (let i = 0; i < 32; i++) {
        if (i < mask_len) {
            mask_binary += "1"
        } else {
            mask_binary += "0"
        }
    }
    let mask = binary_to_ip(mask_binary)
    console.log("mask: " + mask)
    return return_ip(network_address, mask)
}

// Deep copy of object
export function cloneObj(obj) {
    if (typeof obj !== 'object') {
        return obj;
    } else {
        var newobj = obj.constructor === Array ? [] : {};
        for (var i in obj) {
            newobj[i] = typeof obj[i] === 'object' ? cloneObj(obj[i]) : obj[i];
        }
        return newobj;
    }
}


// K6 test function
export default function() {
    let res;
    // res = uuid()
    // console.log(res)

    // let ip = "127.0.0.0"
    // let ip2 = ip_to_binary(ip)
    // console.log(ip2)
    // ip = binary_to_ip(ip2)
    // console.log(ip)

    // let mask = "255.255.255.0"
    // let network_broadcast = get_network_broadcast_addr(ip, mask)
    // console.log(JSON.stringify(network_broadcast))

    // res = return_ip(network_broadcast["network_addr"], network_broadcast["broadcast_addr"])
    // console.log(JSON.stringify(res))

    // let gateway = "127.0.0.254"
    // res = return_ip(network_broadcast["network_addr"], network_broadcast["broadcast_addr"], gateway)
    // console.log(JSON.stringify(res))

    // res = get_cidr_network_address_range("10.0.0.0/8")

    // let A = { "B": 1234, "c": [1, 2, 3, 4], "D": { "E": true } }
    // let F = cloneObj(A)
    // console.log(JSON.stringify(A))
    // console.log(JSON.stringify(F))
    // A["B"] = 88888
    // console.log(JSON.stringify(A))
    // console.log(JSON.stringify(F))

    res = genMAC()
    console.log(res)


}