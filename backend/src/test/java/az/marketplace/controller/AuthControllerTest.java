package az.marketplace.controller;

import az.marketplace.dto.auth.*;
import az.marketplace.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Disabled("Not part of integration scope for now")
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    private AuthResponse fakeResponse;

    @BeforeEach
    void setup() {
        fakeResponse = AuthResponse.builder().token("abc").tokenType("Bearer").build();
    }

    @Test
    void register_shouldReturnToken() throws Exception {
        Mockito.when(authService.register(any(RegisterRequest.class))).thenReturn(fakeResponse);

        String json = """
                {
                  "email": "murad@example.com",
                  "password": "12345",
                  "name": "Murad",
                  "surname": "Mammadov",
                  "type": "CUSTOMER"
                }
                """;

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("abc"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }
}
