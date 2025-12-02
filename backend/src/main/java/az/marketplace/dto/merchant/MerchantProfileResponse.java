package az.marketplace.dto.merchant;

import az.marketplace.entity.Merchant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantProfileResponse {

    private Long id;
    private String name;
    private String surname;
    private String email;
    private String companyName;
    private LocalDateTime createdAt;

    public static MerchantProfileResponse from(Merchant merchant) {
        return MerchantProfileResponse.builder()
                .id(merchant.getId())
                .name(merchant.getUser().getName())
                .surname(merchant.getUser().getSurname())
                .email(merchant.getUser().getEmail())
                .companyName(merchant.getCompanyName())
                .createdAt(merchant.getCreatedAt())
                .build();
    }
}
