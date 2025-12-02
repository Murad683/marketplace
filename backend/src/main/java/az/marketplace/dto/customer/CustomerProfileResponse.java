package az.marketplace.dto.customer;

import az.marketplace.entity.Customer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileResponse {

    private Long id;
    private String name;
    private String surname;
    private String email;
    private BigDecimal balance;
    private LocalDateTime createdAt;

    public static CustomerProfileResponse from(Customer customer) {
        return CustomerProfileResponse.builder()
                .id(customer.getId())
                .name(customer.getUser().getName())
                .surname(customer.getUser().getSurname())
                .email(customer.getUser().getEmail())
                .balance(customer.getBalance())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
