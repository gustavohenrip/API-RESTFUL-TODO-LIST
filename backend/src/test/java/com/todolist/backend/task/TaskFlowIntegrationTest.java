package com.todolist.backend.task;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todolist.backend.support.TestcontainersConfiguration;
import com.todolist.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class TaskFlowIntegrationTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @Autowired private TaskRepository taskRepository;

    @Autowired private UserRepository userRepository;

    private String token;

    @BeforeEach
    void setup() throws Exception {
        taskRepository.deleteAll();
        userRepository.deleteAll();

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(APPLICATION_JSON)
                                .content(
                                        """
                                {
                                  "username": "owner",
                                  "email": "owner@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated());

        String response =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(APPLICATION_JSON)
                                        .content(
                                                """
                                {
                                  "username": "owner",
                                  "password": "password123"
                                }
                                """))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        token = "Bearer " + objectMapper.readTree(response).get("accessToken").asText();
    }

    @Test
    void createUpdateToggleDelete() throws Exception {
        String createdBody =
                mockMvc.perform(
                                post("/api/tasks")
                                        .header("Authorization", token)
                                        .contentType(APPLICATION_JSON)
                                        .content(
                                                """
                                {
                                  "title": "Buy milk",
                                  "description": "Whole"
                                }
                                """))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.title").value("Buy milk"))
                        .andExpect(jsonPath("$.completed").value(false))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        JsonNode created = objectMapper.readTree(createdBody);
        String taskId = created.get("id").asText();

        mockMvc.perform(
                        put("/api/tasks/" + taskId)
                                .header("Authorization", token)
                                .contentType(APPLICATION_JSON)
                                .content(
                                        """
                                {
                                  "completed": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));

        mockMvc.perform(get("/api/tasks?completed=true").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(taskId));

        mockMvc.perform(delete("/api/tasks/" + taskId).header("Authorization", token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks/" + taskId).header("Authorization", token))
                .andExpect(status().isNotFound());
    }

    @Test
    void requestsWithoutTokenAreRejected() throws Exception {
        mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void paginationMetadataIsReturned() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(
                            post("/api/tasks")
                                    .header("Authorization", token)
                                    .contentType(APPLICATION_JSON)
                                    .content("{\"title\": \"Task " + i + "\"}"))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(get("/api/tasks?page=0&size=2").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content.length()").value(2));
    }
}
