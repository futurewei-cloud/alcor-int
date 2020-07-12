package org.vander.consumer;

import org.apache.pulsar.client.api.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class ConsumerRunnable implements Runnable{

    private PulsarClient client;
//    private [] consumerList;
    private List<Consumer<byte[]>> consumerList = new ArrayList<Consumer<byte[]>>();

    private String url = null;
    private String topicName = null;
    private String subtopicName = null;
    private int topicNumberPerThread = 0;

    public ConsumerRunnable(String url, String topicName, String subtopicName, int topicNumberPerThread) {
        this.url = url;
        this.topicName = topicName;
        this.subtopicName = subtopicName;
        this.topicNumberPerThread = topicNumberPerThread;
    }

    @Override
    public void run(){
        try {
            client = PulsarClient.builder()
                    .serviceUrl(url)
                    .build();

            int consumerCount = 100;

            for (int topicIndex = 0; topicIndex < topicNumberPerThread; topicIndex++) {
                consumerList.add(client.newConsumer()
                        .topic(topicName + "-" + topicIndex)
                        .ackTimeout(30, TimeUnit.SECONDS)
                        .subscriptionName(subtopicName)
                        .subscriptionType(SubscriptionType.Shared)
                        .subscribe());
            }

            while (true) {
                for (int topicIndex = 0; topicIndex < topicNumberPerThread; topicIndex++) {
                    consumerCount = 100;
                    while (consumerCount > 0){
                        // Wait for a message
                        Message<byte[]> msg = consumerList.get(topicIndex).receive();
                        try {
                            consumerList.get(topicIndex).acknowledge(msg);
                        } catch (Exception e) {
                            System.err.printf("Unable to consume message: %s", e.getMessage());
                            consumerList.get(topicIndex).negativeAcknowledge(msg);
                        }

                        consumerCount--;
                    }
                }
            }
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
