package az.marketplace.dto.cart;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long itemId;

    private Long productId;
    private String productName;

    private Integer count;

    private BigDecimal pricePerUnit;
    private BigDecimal totalPrice;
}
