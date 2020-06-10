package org.vander;


import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ConsumerThreadPool {
    public static void main(String[] args) {
        int consumerThreadCount = 20;
        int topicNumber = 20;

        String url = "pulsar://localhost:6650";
        String topicName = "my-topic-";
        String subtopicName = "my-subscription";

        ExecutorService pool = Executors.newFixedThreadPool(consumerThreadCount);
        for (int topicIndex = 0; topicIndex < topicNumber; topicIndex++) {
            pool.submit(new ConsumerRunnable(url, topicName + Integer.toString(topicIndex), subtopicName));
        }
        pool.shutdown();
    }
}
