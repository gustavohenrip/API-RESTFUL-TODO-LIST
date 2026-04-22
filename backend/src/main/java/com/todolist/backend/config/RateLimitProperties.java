package com.todolist.backend.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.ratelimit")
public class RateLimitProperties {

    private Login login = new Login();

    public Login getLogin() {
        return login;
    }

    public void setLogin(Login login) {
        this.login = login;
    }

    public static class Login {

        @Min(1)
        private int capacity = 5;

        @Min(1)
        private int refillMinutes = 1;

        public int getCapacity() {
            return capacity;
        }

        public void setCapacity(int capacity) {
            this.capacity = capacity;
        }

        public int getRefillMinutes() {
            return refillMinutes;
        }

        public void setRefillMinutes(int refillMinutes) {
            this.refillMinutes = refillMinutes;
        }
    }
}
