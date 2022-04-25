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

var ip_mac_db = {}
var K6_test_flag = false

export function put_httprequest(url, data = {}) {
  let headers = {}
  let response = {}
  if (K6_test_flag == true) {
    headers = { 'Content-Type': 'application/json' };
  }
  else {
    headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    }
  }
  console.log("PUTing http request")
  console.log("url: " + url)
  console.log("data: " + JSON.stringify(data))
  try {
    response = http.put(url, JSON.stringify(data), { headers: headers })
    if (response.error_code == 0) {
      console.log("PUT Success: " + url)
    }
    else {
      console.log("PUT Fail, error_code: " + response.error_code + " , " + response.error)
    }
    return response.body
  }
  catch (err) {
    console.log("PUT Failed for " + url + " with error_code: " + response.error_code + " , " + response.error)
    return response.error
  }
}


export function post_httprequest(url, data = {}) {
  let headers = {}
  if (K6_test_flag == true) {
    headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Mobile Safari/537.36'
    }
  }
  else {
    headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    }
  }
  let response = {}
  console.log("POSTing http request")
  console.log("url: " + url)
  console.log("data: " + JSON.stringify(data))

  try {
    // Using an object as body, the headers will automatically include
    // 'Content-Type: application/x-www-form-urlencoded'.
    response = http.post(url, JSON.stringify(data), { headers: headers })
    console.log(response.json());
    if (response.error_code == 0) {
      console.log("POST Success: " + url)
      if ("ports" in url) {
        let valid_response = response.body.json()
        console.log(`POST RESPONSE: ${JSON.stringify(valid_response)}`)
        get_mac_for_ips(valid_response)
      }
    }
    else {
      console.log("POST Fail, error_code: " + response.error_code + " , " + response.error)
    }
    return response.body
  }
  catch (err) {
    console.log("POST Failed for " + url + " with error_code: " +
      response.error_code + " , " + response.error)
    return response.error
  }
}


export function get_mac_for_ips(valid_response) {
  console.log("in prepare_payload: ", JSON.stringify(valid_response))
  let ports_info = valid_response["port"]
  let key = ports_info["fixed_ips"][0]["ip_address"]
  let value = ports_info["mac_address"]
  ip_mac_db[key] = value
  console.log("IP_MAC_DB = ", JSON.stringify(ip_mac_db))
}

export function get_httprequest(url) {
  try {
    let response = http.get(url)
    if (response.error_code == 0) {
      console.log("GET Success: " + url)
    }
    else {
      console.log("GET Fail, error_code: " + response.error_code + " , " + response.error)
    }
    return response.body
  }
  catch (err) {
    console.log("GET Failed for " + url + " with error_code: " + response.error_code + " , " + response.error)
    return response.error
  }

}


export function get_mac_from_db() {
  console.log("\n\n\n>>>>>>>")
  console.log("IP & MAC stored in ignite db", JSON.stringify(ip_mac_db))
  return ip_mac_db
}

// simple test
// export default function () {
//   console.log("################ put test ################");
//   let url = 'https://httpbin.test.k6.io/put';
//   let data = { name: 'Bert' };
//   let res = put_httprequest(url, JSON.stringify(data))
//   console.log(JSON.stringify(res));

//   console.log("################ post test ################");
//   url = 'https://fanyi.baidu.com/sug';
//   data = { 'kw': "hello" };
//   res = post_httprequest(url, JSON.stringify(data));
//   console.log(JSON.stringify(res));

//   console.log("################ get test ################");
//   url = 'https://test.k6.io';
//   res = get_httprequest(url);
//   console.log(JSON.stringify(res));

//   console.log("################ get_mac_from_db ################");
//   get_mac_from_db()
// }

