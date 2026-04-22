package com.todolist.backend.config;

import com.todolist.backend.common.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
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

    private static final int MIN_SECRET_BYTES = 32;

    @NotBlank
    private String issuer;

    @NotBlank
    private String secret;

    @Min(5)
    private long expirationMinutes;

    private byte[] decodedSecret;

    @PostConstruct
    void verifySecret() {
        try {
            decodedSecret = Base64.getDecoder().decode(secret.trim().getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("app.jwt.secret must be a valid Base64 string");
        }
        if (decodedSecret.length < MIN_SECRET_BYTES) {
            throw new BadRequestException("app.jwt.secret must decode to at least " + MIN_SECRET_BYTES + " bytes");
        }
    }

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
        return decodedSecret.clone();
    }

    public SecretKey secretKey() {
        return new SecretKeySpec(decodedSecret, "HmacSHA256");
    }
}
