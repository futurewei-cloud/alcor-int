package org.vander.keysharedStandalone;

import org.apache.pulsar.client.api.*;
import org.apache.pulsar.client.impl.Murmur3_32Hash;

import java.util.concurrent.TimeUnit;

public class PulsarConsumers {

    private static PulsarClient client;
    private static Consumer<byte[]> consumer;

    public static void main(String[] args) throws Exception {
        client = PulsarClient.builder()
                .serviceUrl("pulsar://localhost:6650")
                .build();

        int hashcode = Murmur3_32Hash.getInstance().makeHash("key-1") % 65536;

        consumer = client.newConsumer()
                .topic("my-topic")
                .ackTimeout(30, TimeUnit.SECONDS)
                .subscriptionName("my-subscription")
                .subscriptionType(SubscriptionType.Key_Shared)
                .keySharedPolicy(KeySharedPolicy.stickyHashRange().ranges(Range.of(hashcode - 1, hashcode + 1)))
                .subscribe();

        startConsumer();

    }

    private static void startConsumer() throws PulsarClientException {

        while (true) {

            // Wait for a message
            Message<byte[]> msg = consumer.receive();
            try {
                System.out.printf("Message received: %s", new String(msg.getData()));
                consumer.acknowledge(msg);
            } catch (Exception e) {
                System.err.printf("Unable to consume message: %s", e.getMessage());
                consumer.negativeAcknowledge(msg);
            }
        }
    }
}
