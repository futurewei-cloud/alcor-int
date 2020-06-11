Deploy CNI plugin in Kubernetes as DaemonSet
============================================

# Prerequisite
Each node in cluster has to present following files in order for the pod to be able to get needed information of the node:

| file path | sample data | purpose | note |
| --- | --- | --- | --- |
| /etc/mizarmp/hostid | ephost_3 | host id registered in mizarmp system for the node | no newline or space char in the file |
| /etc/mizarmp/mpurl | http://10.200.0.138:8080 | URL of mizarmp controller service | no newline or space char in the file |

## Instruction
```bash
kubectl apply -f cniplugin-deploy.yaml
```
