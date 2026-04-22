package com.todolist.backend.task.dto;

import jakarta.validation.constraints.Size;

public record TaskUpdateRequest(
        @Size(max = 120) String title, @Size(max = 1000) String description, Boolean completed) {}
