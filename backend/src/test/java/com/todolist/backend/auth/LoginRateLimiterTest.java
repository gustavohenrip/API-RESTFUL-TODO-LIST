package com.todolist.backend.auth;

import com.todolist.backend.config.RateLimitProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    @Test
    void allowsUpToCapacityThenDenies() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.getLogin().setCapacity(3);
        properties.getLogin().setRefillMinutes(1);
        LoginRateLimiter limiter = new LoginRateLimiter(properties);

        assertThat(limiter.tryConsume("1.1.1.1").isConsumed()).isTrue();
        assertThat(limiter.tryConsume("1.1.1.1").isConsumed()).isTrue();
        assertThat(limiter.tryConsume("1.1.1.1").isConsumed()).isTrue();
        assertThat(limiter.tryConsume("1.1.1.1").isConsumed()).isFalse();
    }

    @Test
    void bucketsAreScopedByKey() {
        RateLimitProperties properties = new RateLimitProperties();
        properties.getLogin().setCapacity(1);
        properties.getLogin().setRefillMinutes(1);
        LoginRateLimiter limiter = new LoginRateLimiter(properties);

        assertThat(limiter.tryConsume("a").isConsumed()).isTrue();
        assertThat(limiter.tryConsume("a").isConsumed()).isFalse();
        assertThat(limiter.tryConsume("b").isConsumed()).isTrue();
    }
}
