package org.vander;

import org.vander.producer.ProducerRunnable;

import java.util.List;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProducerThreadPool {
    public static void main(String[] args) {
        PulsarConfig config = new PulsarConfig();

        int producerThreadNumber = config.getProducerThreadNumber();
        int topicNumberPerThread = config.getTopicNumberPerThread();

        List<String> producerUrlList = config.getProducerUrlList();
        String topicName = config.getTopicName();
        int size = config.getSize();   //byte

        ExecutorService pool = Executors.newFixedThreadPool(producerThreadNumber);
        for (int threadIndex = 0; threadIndex < producerThreadNumber; threadIndex++) {
            String url = producerUrlList.get((int)(Math.random()*producerUrlList.size()));
            pool.submit(new ProducerRunnable(url, topicName + threadIndex, size, topicNumberPerThread));
        }
        pool.shutdown();
    }
}
