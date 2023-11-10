FROM ubuntu:18.04
RUN apt update
RUN apt upgrade -y
RUN apt install -y git
RUN apt install -y wget
RUN apt install -y uuid
RUN apt-get install -y uuid-dev
RUN apt install -y openvswitch-switch=2.9.8-0ubuntu0.18.04.2

RUN git clone --recurse-submodules https://github.com/futurewei-cloud/alcor-control-agent.git /root/alcor-control-agent

ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/lib/
RUN /root/alcor-control-agent/build/aca-machine-init.sh
CMD sh /root/alcor-control-agent/build/aca_container/aca_run.sh
