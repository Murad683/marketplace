package az.marketplace.dto.order;

import az.marketplace.entity.enums.OrderStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long orderId;

    private Long productId;
    private String productName;

    private Integer count;
    private BigDecimal totalAmount;

    private OrderStatus status;

    private LocalDateTime createdAt;
}
