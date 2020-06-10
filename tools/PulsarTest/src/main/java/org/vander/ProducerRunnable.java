package org.vander;

import org.apache.pulsar.client.api.Producer;
import org.apache.pulsar.client.api.PulsarClient;

import javax.swing.*;
import java.util.Arrays;

public class ProducerRunnable implements Runnable{

    private PulsarClient client;
    private Producer<byte[]> producer;

    private String url = null;
    private String topicName = null;
    private int sleepTime = 0;
    private int size = 0;

    public ProducerRunnable(String url, String topicName, int sleepTime, int size) {
        this.url = url;
        this.topicName = topicName;
        this.sleepTime = sleepTime;
        this.size = size;
    }

    private static String createSpecificSizeString(int size){
        byte[] temp = new byte[size];
        Arrays.fill(temp, (byte)0);
        String temp_str = new String(temp);
        return temp_str;
    }

    private void startProducer(String topicName, int sleepTime, int size) throws Exception {
        System.out.println(topicName + " " + "Start produce");
        while (true) {

            long startTime = System.currentTimeMillis();

//            producer.newMessage()
//                    .value((topicName + " " + Thread.currentThread().getName()).getBytes())
//                    .sendAsync()
//                    .thenAccept(msgId -> {
//                        System.out.printf("Message with ID %s successfully sent with time %d\n", msgId, (System.currentTimeMillis() - startTime));
//                    });

            producer.newMessage()
                    .value(createSpecificSizeString(size).getBytes())
                    .sendAsync()
                    .thenAccept(msgId -> {
                        System.out.printf("Message with ID %s successfully sent with time %d\n", msgId, (System.currentTimeMillis() - startTime));
                    });


            Thread.sleep(sleepTime);
        }
    }

    @Override
    public void run(){
        try {
            client = PulsarClient.builder()
                    .serviceUrl(url)
                    .build();

            producer = client.newProducer()
                    .topic(topicName)
                    .create();

            startProducer(topicName, sleepTime,size);
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
