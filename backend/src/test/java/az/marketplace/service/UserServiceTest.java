package az.marketplace.service;

import az.marketplace.config.JwtService;
import az.marketplace.dto.auth.RegisterRequest;
import az.marketplace.entity.User;
import az.marketplace.entity.enums.UserType;
import az.marketplace.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Disabled("User service test not finalized yet")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private MerchantRepository merchantRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void register_shouldHashPasswordAndSaveUser() {
        RegisterRequest req = RegisterRequest.builder()
                .email("murad@example.com")
                .password("12345")
                .name("Murad")
                .surname("Mammadov")
                .type(UserType.CUSTOMER)
                .build();

        when(userRepository.existsByEmail("murad@example.com")).thenReturn(false);
        when(passwordEncoder.encode("12345")).thenReturn("hashed");
        when(jwtService.generateToken(anyString(), any())).thenReturn("fake-jwt");

        var response = authService.register(req);

        assertNotNull(response);
        assertEquals("Bearer", response.getTokenType());
        verify(userRepository, times(1)).save(any(User.class));
    }
}
