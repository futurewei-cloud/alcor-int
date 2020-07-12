### Deployment

#### Deploy with Docker

Start cluster with 3 brokers and 3 bookies.

```shell script
cd deployment/docker
docker-compose up -d
```

Shutdown the cluster
```shell script
cd deployment/docker
./down.sh
```

## Deploy a cluster on bare metal

Following the [official instruction](https://pulsar.apache.org/docs/en/deploy-bare-metal/).

Using Conf

```bash
mkdir -pv data/zookeeper
echo 1 > data/zookeeper/myid
```

Start zookeeper

```bash
bin/pulsar-daemon start zookeeper
```

```bash
bin/pulsar initialize-cluster-metadata --cluster pulsar-cluster-1 --zookeeper 219.219.223.222:2181 --configuration-store 219.219.223.222:2181 --web-service-url http://219.219.223.222:8080,219.219.223.224:8080,219.219.223.226:8080 --web-service-url-tls https://219.219.223.222:8443,219.219.223.224:8443,219.219.223.226:8443 --broker-service-url pulsar://219.219.223.222:6650,219.219.223.224:6650,219.219.223.226:6650 --broker-service-url-tls pulsar+ssl://219.219.223.222:6651,219.219.223.6651
```
prometheusStatsHttpPort=8100

```bash
bin/bookkeeper shell metaformat
```

```bash
bin/pulsar-daemon start bookie
```

```bash
bin/pulsar-daemon start broker
```

```bash
bin/pulsar-admin brokers list pulsar-cluster
```


bin/pulsar standalone --advertised-address 1.2.3.4
### Usage

Config the 

Build the project

```shell script
mvn clean package
```

Start Producer

```shell script
java -cp ./target/pulsar-demo-0.0.1-SNAPSHOT-jar-with-dependencies.jar org.vander.ProducerThreadPool
```

Start Consumer

```shell script
java -cp ./target/pulsar-demo-0.0.1-SNAPSHOT-jar-with-dependencies.jar org.vander.ConsumerThreadPool
```

