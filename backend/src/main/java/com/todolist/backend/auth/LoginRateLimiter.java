package com.todolist.backend.auth;

import com.todolist.backend.config.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class LoginRateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final RateLimitProperties properties;

    public LoginRateLimiter(RateLimitProperties properties) {
        this.properties = properties;
    }

    public ConsumptionProbe tryConsume(String key) {
        Bucket bucket = buckets.computeIfAbsent(key, this::newBucket);
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    private Bucket newBucket(String key) {
        RateLimitProperties.Login login = properties.getLogin();
        Bandwidth bandwidth =
                Bandwidth.classic(
                        login.getCapacity(),
                        Refill.intervally(
                                login.getCapacity(), Duration.ofMinutes(login.getRefillMinutes())));
        return Bucket.builder().addLimit(bandwidth).build();
    }
}
