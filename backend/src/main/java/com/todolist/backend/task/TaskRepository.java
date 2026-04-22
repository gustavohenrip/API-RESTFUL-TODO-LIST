package com.todolist.backend.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    Page<TaskEntity> findAllByOwnerId(UUID ownerId, Pageable pageable);

    Page<TaskEntity> findAllByOwnerIdAndCompleted(UUID ownerId, boolean completed, Pageable pageable);

    Optional<TaskEntity> findByIdAndOwnerId(UUID id, UUID ownerId);
}
