package az.marketplace.dto.product;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String details;
    private BigDecimal price;
    private Integer stockCount;

    private Long merchantId;
    private String merchantCompanyName;

    private Long categoryId;
    private String categoryName;

    private List<String> photoUrls;

    // NEW badge üçün
    private LocalDateTime createdAt;
}
