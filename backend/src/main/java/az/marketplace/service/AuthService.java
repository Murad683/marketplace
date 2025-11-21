package az.marketplace.service;

import az.marketplace.config.JwtService;
import az.marketplace.dto.auth.AuthResponse;
import az.marketplace.dto.auth.LoginRequest;
import az.marketplace.dto.auth.RegisterRequest;
import az.marketplace.entity.*;
import az.marketplace.entity.enums.UserType;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;
    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Yeni user yarat
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .surname(request.getSurname())
                .type(request.getType()) // CUSTOMER / MERCHANT
                .build();

        user = userRepository.save(user);

        if (request.getType() == UserType.MERCHANT) {

            if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
                throw new IllegalArgumentException("companyName is required for MERCHANT");
            }

            Merchant merchant = Merchant.builder()
                    .user(user)
                    .companyName(request.getCompanyName())
                    .build();

            merchantRepository.save(merchant);

        } else if (request.getType() == UserType.CUSTOMER) {

            Customer customer = Customer.builder()
                    .user(user)
                    .balance(BigDecimal.ZERO)
                    .build();

            customerRepository.save(customer);

            Cart cart = Cart.builder()
                    .user(user)
                    .build();

            cartRepository.save(cart);

        } else {
            throw new IllegalArgumentException("Unsupported user type");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getType());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .type(user.getType().name()) // CUSTOMER / MERCHANT
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean passwordOk = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!passwordOk) {
            throw new AccessDeniedException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getType());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .type(user.getType().name())
                .build();
    }
}
