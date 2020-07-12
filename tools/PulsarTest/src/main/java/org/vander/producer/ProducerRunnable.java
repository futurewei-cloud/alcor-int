package org.vander.producer;

import org.apache.pulsar.client.api.Producer;
import org.apache.pulsar.client.api.PulsarClient;

import javax.swing.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ProducerRunnable implements Runnable{

    private PulsarClient client;
    private List<Producer<byte[]>> producerList = new ArrayList<Producer<byte[]>>();

    private String url = null;
    private String topicName = null;
    private int sleepTime = 0;
    private int size = 0;
    private int topicNumberPerThread = 0;
    private String payload = null;

    public ProducerRunnable(String url, String topicName, int size, int topicNumberPerThread) {
        this.url = url;
        this.topicName = topicName;
        this.size = size;
        this.payload = createSpecificSizeString(size);
        this.topicNumberPerThread = topicNumberPerThread;
    }

    private static String createSpecificSizeString(int size){
        byte[] temp = new byte[size];
        Arrays.fill(temp, (byte)0);
        String temp_str = new String(temp);
        return temp_str;
    }

    @Override
    public void run() {
        try {
            client = PulsarClient.builder()
                    .serviceUrl(url)
                    .build();

            for (int topicIndex = 0; topicIndex < topicNumberPerThread; topicIndex++) {
                producerList.add(client.newProducer()
                        .topic(topicName + "-" + topicIndex)
                        .create());
            }

            while (true) {
                for (int topicIndex = 0; topicIndex < topicNumberPerThread; topicIndex++) {
                    long startTime = System.currentTimeMillis();

                    producerList.get(topicIndex).newMessage()
                            .value(payload.getBytes())
                            .sendAsync()
                            .thenAccept(msgId -> {
                                System.out.printf("Message with ID %s successfully sent with time %d\n", msgId, (System.currentTimeMillis() - startTime));
                            });
                }
            }
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
