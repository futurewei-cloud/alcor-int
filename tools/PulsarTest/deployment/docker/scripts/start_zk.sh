#!/bin/bash

mkdir -p data/zookeeper
echo $ZK_ID > data/zookeeper/myid
nohup bin/pulsar zookeeper > logs/zookeeper.log 2>&1
