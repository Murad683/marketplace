package az.marketplace.dto.order;

import lombok.Data;

@Data
public class CancelOrderRequest {
    private String reason;
}
