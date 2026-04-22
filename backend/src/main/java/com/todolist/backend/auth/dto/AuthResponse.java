package com.todolist.backend.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record AuthResponse(
        UUID id,
        String username,
        String email,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        String accessToken,
        String tokenType,
        Instant expiresAt) {}
