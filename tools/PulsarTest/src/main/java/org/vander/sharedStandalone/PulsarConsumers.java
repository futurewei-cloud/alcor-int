package org.vander.sharedStandalone;

import java.util.concurrent.TimeUnit;

import org.apache.pulsar.client.api.Consumer;
import org.apache.pulsar.client.api.DeadLetterPolicy;
import org.apache.pulsar.client.api.Message;
import org.apache.pulsar.client.api.PulsarClient;
import org.apache.pulsar.client.api.PulsarClientException;
import org.apache.pulsar.client.api.SubscriptionType;

public class PulsarConsumers {

    private static PulsarClient client;
    private static Consumer<byte[]> consumer;

    public static void main(String[] args) throws Exception {
        client = PulsarClient.builder()
                .serviceUrl("pulsar://localhost:6650")
                .build();

        consumer = client.newConsumer()
                .topic("my-topic")
                .ackTimeout(30, TimeUnit.SECONDS)
                .subscriptionName("my-subscription")
                .subscriptionType(SubscriptionType.Shared)
                .deadLetterPolicy(DeadLetterPolicy.builder()
                        .maxRedeliverCount(10)
                        .deadLetterTopic("dl-topic-name")
                        .build())
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
