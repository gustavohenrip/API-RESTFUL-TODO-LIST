package com.todolist.backend.task;

import com.todolist.backend.common.exception.BadRequestException;
import com.todolist.backend.common.exception.ResourceNotFoundException;
import com.todolist.backend.common.exception.UnauthorizedException;
import com.todolist.backend.task.dto.TaskCreateRequest;
import com.todolist.backend.task.dto.TaskResponse;
import com.todolist.backend.task.dto.TaskUpdateRequest;
import com.todolist.backend.user.UserEntity;
import com.todolist.backend.user.UserRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> listTasks(String username, Boolean completed, Pageable pageable) {
        UserEntity user = requireUser(username);
        Page<TaskEntity> page =
                completed == null
                        ? taskRepository.findAllByOwnerId(user.getId(), pageable)
                        : taskRepository.findAllByOwnerIdAndCompleted(
                                user.getId(), completed, pageable);
        return page.map(TaskResponse::from);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(String username, UUID taskId) {
        UserEntity user = requireUser(username);
        return TaskResponse.from(requireTask(user.getId(), taskId));
    }

    @Transactional
    public TaskResponse createTask(String username, TaskCreateRequest request) {
        UserEntity user = requireUser(username);
        TaskEntity task = new TaskEntity();
        task.setOwner(user);
        task.setTitle(normalizeTitle(request.title()));
        task.setDescription(normalizeDescription(request.description()));
        task.setCompleted(false);
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(String username, UUID taskId, TaskUpdateRequest request) {
        UserEntity user = requireUser(username);
        TaskEntity task = requireTask(user.getId(), taskId);

        if (request.title() != null) {
            task.setTitle(normalizeTitle(request.title()));
        }

        if (request.description() != null) {
            task.setDescription(normalizeDescription(request.description()));
        }

        if (request.completed() != null) {
            task.setCompleted(request.completed());
        }

        return TaskResponse.from(task);
    }

    @Transactional
    public void deleteTask(String username, UUID taskId) {
        UserEntity user = requireUser(username);
        TaskEntity task = requireTask(user.getId(), taskId);
        taskRepository.delete(task);
    }

    private UserEntity requireUser(String username) {
        String normalizedUsername = normalizeUsername(username);
        return userRepository
                .findByUsername(normalizedUsername)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private TaskEntity requireTask(UUID userId, UUID taskId) {
        return taskRepository
                .findByIdAndOwnerId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        return normalized;
    }

    private String normalizeTitle(String title) {
        String normalized = title == null ? "" : title.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Title is required");
        }
        return normalized;
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalized = description.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
