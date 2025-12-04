package az.marketplace.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotNull
    private Long categoryId;

    @NotBlank
    private String name;

    @NotBlank
    private String details;

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal price;

    @NotNull
    @Min(0)
    private Integer stockCount;

    // Photos əlavə endpointlə verilir:
    // POST /products/{productId}/photos  (body: { "photoUrl": "https://..." })
}
