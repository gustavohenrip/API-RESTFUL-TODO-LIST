package com.todolist.backend.task;

import com.todolist.backend.auth.dto.UserResponse;
import com.todolist.backend.common.exception.BadRequestException;
import com.todolist.backend.common.exception.ResourceNotFoundException;
import com.todolist.backend.common.exception.UnauthorizedException;
import com.todolist.backend.task.dto.TaskCreateRequest;
import com.todolist.backend.task.dto.TaskResponse;
import com.todolist.backend.task.dto.TaskUpdateRequest;
import com.todolist.backend.user.UserEntity;
import com.todolist.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(String username, Boolean completed) {
        UserEntity user = requireUser(username);
        List<TaskEntity> tasks = completed == null
                ? taskRepository.findAllByOwnerIdOrderByCreatedAtDesc(user.getId())
                : taskRepository.findAllByOwnerIdAndCompletedOrderByCreatedAtDesc(user.getId(), completed);
        return tasks.stream().map(TaskResponse::from).toList();
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

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(String username, UUID taskId) {
        UserEntity user = requireUser(username);
        TaskEntity task = requireTask(user.getId(), taskId);
        taskRepository.delete(task);
    }

    private UserEntity requireUser(String username) {
        String normalizedUsername = normalizeUsername(username);
        return userRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private TaskEntity requireTask(UUID userId, UUID taskId) {
        return taskRepository.findByIdAndOwnerId(taskId, userId)
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
