package com.todolist.backend.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Validated
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    @NotBlank
    private String issuer;

    @NotBlank
    private String secret;

    @Min(5)
    private long expirationMinutes;

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMinutes() {
        return expirationMinutes;
    }

    public void setExpirationMinutes(long expirationMinutes) {
        this.expirationMinutes = expirationMinutes;
    }

    public Duration getExpiration() {
        return Duration.ofMinutes(expirationMinutes);
    }

    public byte[] secretBytes() {
        return Base64.getDecoder().decode(secret.trim().getBytes(StandardCharsets.UTF_8));
    }

    public SecretKey secretKey() {
        return new SecretKeySpec(secretBytes(), "HmacSHA256");
    }
}
