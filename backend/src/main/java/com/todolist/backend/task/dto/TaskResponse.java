package com.todolist.backend.task.dto;

import com.todolist.backend.task.TaskEntity;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        boolean completed,
        Instant createdAt,
        Instant updatedAt) {

    public static TaskResponse from(TaskEntity task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isCompleted(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
