package com.todolist.backend.auth;

import com.todolist.backend.auth.dto.AuthResponse;
import com.todolist.backend.auth.dto.LoginRequest;
import com.todolist.backend.auth.dto.RegisterRequest;
import com.todolist.backend.auth.dto.UserResponse;
import com.todolist.backend.common.exception.BadRequestException;
import com.todolist.backend.common.exception.ConflictException;
import com.todolist.backend.common.exception.ForbiddenException;
import com.todolist.backend.common.exception.UnauthorizedException;
import com.todolist.backend.user.UserEntity;
import com.todolist.backend.user.UserRepository;
import java.time.Instant;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String username = normalizeUsername(request.username());
        String email = normalizeEmail(request.email());

        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username already registered");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already registered");
        }

        UserEntity user = new UserEntity();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setActive(true);

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserEntity user =
                userRepository
                        .findByUsername(normalizeUsername(request.username()))
                        .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!user.isActive()) {
            throw new ForbiddenException("Account disabled");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        Instant issuedAt = jwtService.now();
        Instant expiresAt = jwtService.expiresAt(issuedAt);
        String token = jwtService.createToken(user, issuedAt, expiresAt);

        return new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                token,
                "bearer",
                expiresAt);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String username) {
        return UserResponse.from(
                userRepository
                        .findByUsername(normalizeUsername(username))
                        .orElseThrow(() -> new UnauthorizedException("User not found")));
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        return normalized;
    }
}
