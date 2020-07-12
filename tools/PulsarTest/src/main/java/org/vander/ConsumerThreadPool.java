package org.vander;


import org.vander.consumer.ConsumerRunnable;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ConsumerThreadPool {
    public static void main(String[] args) {
        PulsarConfig config = new PulsarConfig();

        int consumerThreadNumber = config.getConsumerThreadNumber();
        int topicNumberPerThread = config.getTopicNumberPerThread();

        String url = config.getConsumerUrl();
        String topicName = config.getTopicName();
        String subtopicName = config.getTopicName();

        ExecutorService pool = Executors.newFixedThreadPool(consumerThreadNumber);
        for (int threadIndex = 0; threadIndex < consumerThreadNumber; threadIndex++) {
            pool.submit(new ConsumerRunnable(url, topicName + Integer.toString(threadIndex), subtopicName, topicNumberPerThread));
        }
        pool.shutdown();
    }
}
