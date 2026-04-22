package com.todolist.backend.task;

import com.todolist.backend.common.exception.BadRequestException;
import com.todolist.backend.common.exception.ResourceNotFoundException;
import com.todolist.backend.common.exception.UnauthorizedException;
import com.todolist.backend.task.dto.TaskCreateRequest;
import com.todolist.backend.task.dto.TaskResponse;
import com.todolist.backend.task.dto.TaskUpdateRequest;
import com.todolist.backend.user.UserEntity;
import com.todolist.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private UserEntity owner;

    @BeforeEach
    void setup() {
        owner = new UserEntity();
        owner.setId(UUID.randomUUID());
        owner.setUsername("owner");
    }

    @Test
    void createTaskNormalizesInput() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(invocation -> {
            TaskEntity stored = invocation.getArgument(0);
            stored.setId(UUID.randomUUID());
            stored.setCreatedAt(Instant.now());
            stored.setUpdatedAt(Instant.now());
            return stored;
        });

        TaskResponse response = taskService.createTask("owner", new TaskCreateRequest("  Do the thing  ", "  "));

        assertThat(response.title()).isEqualTo("Do the thing");
        assertThat(response.description()).isNull();
        assertThat(response.completed()).isFalse();
    }

    @Test
    void updateTaskPartialChangesOnlyProvidedFields() {
        UUID taskId = UUID.randomUUID();
        TaskEntity existing = new TaskEntity();
        existing.setId(taskId);
        existing.setTitle("Old");
        existing.setDescription("Old description");
        existing.setCompleted(false);
        existing.setOwner(owner);

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(taskRepository.findByIdAndOwnerId(taskId, owner.getId())).thenReturn(Optional.of(existing));

        TaskResponse response = taskService.updateTask(
                "owner",
                taskId,
                new TaskUpdateRequest(null, null, true)
        );

        assertThat(response.title()).isEqualTo("Old");
        assertThat(response.completed()).isTrue();
        verify(taskRepository, never()).save(any(TaskEntity.class));
    }

    @Test
    void listTasksAppliesCompletedFilter() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        TaskEntity task = new TaskEntity();
        task.setId(UUID.randomUUID());
        task.setTitle("Done");
        task.setCompleted(true);
        task.setOwner(owner);
        task.setCreatedAt(Instant.now());
        task.setUpdatedAt(Instant.now());

        Pageable pageable = PageRequest.of(0, 10);
        Page<TaskEntity> page = new PageImpl<>(List.of(task), pageable, 1);
        when(taskRepository.findAllByOwnerIdAndCompleted(owner.getId(), true, pageable)).thenReturn(page);

        Page<TaskResponse> result = taskService.listTasks("owner", true, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).completed()).isTrue();
        verify(taskRepository, never()).findAllByOwnerId(any(), any());
    }

    @Test
    void getTaskThrowsResourceNotFoundWhenMissing() {
        UUID taskId = UUID.randomUUID();
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(taskRepository.findByIdAndOwnerId(taskId, owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTask("owner", taskId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void requireUserThrowsUnauthorizedWhenUserMissing() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.listTasks("ghost", null, PageRequest.of(0, 10)))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void createTaskRejectsBlankTitle() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> taskService.createTask("owner", new TaskCreateRequest("  ", null)))
                .isInstanceOf(BadRequestException.class);

        verify(taskRepository, never()).save(any(TaskEntity.class));
        verify(taskRepository, never()).findAllByOwnerIdAndCompleted(any(), anyBoolean(), any());
    }
}
