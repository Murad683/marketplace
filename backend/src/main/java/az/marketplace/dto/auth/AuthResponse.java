package az.marketplace.dto.auth;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType; // "Bearer"
    private String email;
    private String type; // "CUSTOMER" or "MERCHANT"
}
