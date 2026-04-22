package com.todolist.backend.task;

import com.todolist.backend.task.dto.TaskCreateRequest;
import com.todolist.backend.task.dto.TaskResponse;
import com.todolist.backend.task.dto.TaskUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Boolean completed) {
        return taskService.listTasks(jwt.getSubject(), completed);
    }

    @GetMapping("/{taskId}")
    public TaskResponse get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID taskId) {
        return taskService.getTask(jwt.getSubject(), taskId);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TaskCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(jwt.getSubject(), request));
    }

    @PutMapping("/{taskId}")
    public TaskResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskUpdateRequest request) {
        return taskService.updateTask(jwt.getSubject(), taskId, request);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID taskId) {
        taskService.deleteTask(jwt.getSubject(), taskId);
        return ResponseEntity.noContent().build();
    }
}
