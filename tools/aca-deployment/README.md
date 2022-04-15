# ACA Deployment

This wiki describes how to use scripts in this folder to automatically deploy Alcor Controller Agents on each compute nodes. 

Before starting, you need to configure public-key authentication on each compute nodes.
The deployment node should be able to access (via ssh and scp) to those compute nodes without password.

## 1. Prepare Compute Nodes File
Create a new file or modify `compute_node_ips.txt`. List IP address of each compute node on management network in the file. 

## 2. Run the deployment script
Run `update-compute-nodes.sh` on the deployment host. The script will copy `aca_update.sh` to each compute node and run them parallel.  

```
update-compute-nodes.sh aca_update.sh compute_node_ips.txt
```

## 3. Check deployment logs
The script will record all processes and results from each compute node under `/aca_logs` folder.
