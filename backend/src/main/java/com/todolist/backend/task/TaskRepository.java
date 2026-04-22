package com.todolist.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {
    List<TaskEntity> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<TaskEntity> findAllByOwnerIdAndCompletedOrderByCreatedAtDesc(UUID ownerId, boolean completed);

    Optional<TaskEntity> findByIdAndOwnerId(UUID id, UUID ownerId);
}
