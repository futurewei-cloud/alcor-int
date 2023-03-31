"This Project has been archived by the owner, who is no longer providing support.  The project remains available to authorized users on a "read only" basis."

# Alcor Integration Repository
Alcor Hyperscale Cloud Native Control Plane

* For information about how to use Alcor, visit [Getting Started](https://github.com/futurewei-cloud/alcor/blob/master/docs/README.md)
* To ask questions, raise feature requests and get assistance from our community, join [Alcor Slack](https://alcor-networking.slack.com/) channels ([invitation](https://join.slack.com/t/alcor-networking/shared_invite/zt-cudckviu-hcsMI4LWB4cRWy4hn3N3oQ) for first-time participant) or [Google Group](https://groups.google.com/forum/#!forum/alcor-dev)
* To report an issue, visit [Issues page](https://github.com/futurewei-cloud/Alcor/issues)
* To find many useful documents, visit our [Wiki](https://github.com/futurewei-cloud/Alcor/wiki).
For example, [Kubernetes cluster setup guide with Alcor](https://github.com/futurewei-cloud/mizar-mp/wiki/K8s-Cluster-Setup-Guide-with-Mizar-MP)
shows how to use Alcor for Kubernetes container network provisioning.


In this README:

- [Repositories](#repositories)
- [Directory Structure](#directory-structure)


## Repositories
The Alcor project includes several GitHub repositories, each corresponding to standalone component in Alcor.

- [alcor/integration](https://github.com/futurewei-cloud/alcor-int):
The repository that you are currently looking at is the integration repository containing codes and scripts for end-to-end integration of Alcor control plane with popular orchestration platforms and data plane implementations.
We currently support integration with Kubernetes (via CNI plugin), and OVS and Mizar Data Plane.
We will continue to integrate with other orchestration systems and data plane implementations.

- [alcor/alcor](https://github.com/futurewei-cloud/alcor):
Main repository of Alcor Regional Controller.
It includes source codes, build and deployment instructions, and various documents that detail the design of Alcor.
[AlcorController](AlcorController) in this repo points to a snapshot of Alcor Controller which passes integration test.

- [alcor/alcor_control_agent](https://github.com/futurewei-cloud/alcor-control-agent):
Repository of a host-level stateless agent which bridges regional controllers and the host data-plane component.
It is responsible for programming on-host data plane with various network configuration for CURD of _VPC, subnet, port, Security group etc._,
 and monitoring network health of containers and VMs on the host.
[AlcorControlAgent](AlcorControlAgent) in this repo points to a snapshot of Alcor Control Agent which passes integration test.

- [alcor/meeting](https://github.com/futurewei-cloud/alcor-meeting):
The meeting repository is used to store all the meeting notes and recorded video clips for the Alcor Open Source project.

## Directory Structure
This repository is organized as follows:

* [build](build): build, deployment and testing scripts
* [monitoring](monitoring): monitoring plane configuration and results
* [plugins](plugins):  various plugin to integrate Alcor with different popular orchestration system like Kubernetes.
* [tools](tools): tools used for performanace testing, Integration clients for AWS etc.
