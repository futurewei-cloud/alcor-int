#!/bin/bash

if [ ! -d /var/local/git/pulsar ]; then
        PULSAR_RELEASE_TAG='pulsar-2.6.1'
        echo "7--- installing pulsar dependacies ---" && \
        mkdir -p /var/local/git/pulsar && \
        wget https://archive.apache.org/dist/pulsar/${PULSAR_RELEASE_TAG}/DEB/apache-pulsar-client.deb -O /var/local/git/pulsar/apache-pulsar-client.deb && \
        wget https://archive.apache.org/dist/pulsar/${PULSAR_RELEASE_TAG}/DEB/apache-pulsar-client-dev.deb -O /var/local/git/pulsar/apache-pulsar-client-dev.deb && \
        cd /var/local/git/pulsar && \
        apt install -y ./apache-pulsar-client*.deb
fi

if [ ! -d /root/alcor-control-agent ]; then
        git clone --recurse-submodules https://github.com/er1cthe0ne/alcor-control-agent.git /root/alcor-control-agent
        cd /root/alcor-control-agent
        ./build/aca-machine-init.sh
else
        cd /root/alcor-control-agent/

        git fetch

        git checkout master

        git pull

        git submodule update --init --recursive

        make clean && make

        ovs-vsctl del-br br-int && ovs-vsctl del-br br-tun
fi

#if pgrep -x "AlcorControlAge" > /dev/null; then
pkill AlcorControlAge
#fi

nohup /root/alcor-control-agent/build/bin/AlcorControlAgent -d >/dev/null </dev/null 2>&1 &
