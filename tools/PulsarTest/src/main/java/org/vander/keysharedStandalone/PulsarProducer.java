package org.vander.keysharedStandalone;

import org.apache.pulsar.client.api.BatcherBuilder;
import org.apache.pulsar.client.api.Producer;
import org.apache.pulsar.client.api.PulsarClient;

public class PulsarProducer {

    private static PulsarClient client;
    private static Producer<byte[]> producer;

    public static void main(String[] args) throws Exception {
        client = PulsarClient.builder()
                .serviceUrl("pulsar://localhost:6650")
                .build();

        producer = client.newProducer()
                .batcherBuilder(BatcherBuilder.KEY_BASED)
                .enableBatching(true)
                .topic("my-topic")
                .create();

        startProducer();

    }

    private static void startProducer() throws Exception {
        while (true){
            System.out.println("Key Shared Message round!");

            producer.newMessage().key("key-1").value("message-1-1\n".getBytes()).send();
            producer.newMessage().key("key-1").value("message-1-2\n".getBytes()).send();
            producer.newMessage().key("key-1").value("message-1-3\n".getBytes()).send();
            producer.newMessage().key("key-2").value("message-2-1\n".getBytes()).send();
            producer.newMessage().key("key-2").value("message-2-2\n".getBytes()).send();
            producer.newMessage().key("key-2").value("message-2-3\n".getBytes()).send();
            // producer.newMessage().key("key-3").value("message-3-1\n".getBytes()).send();
            // producer.newMessage().key("key-3").value("message-3-2\n".getBytes()).send();
            // producer.newMessage().key("key-4").value("message-4-1\n".getBytes()).send();
            // producer.newMessage().key("key-4").value("message-4-2\n".getBytes()).send();

            Thread.sleep(1000);
        }

    }
}
