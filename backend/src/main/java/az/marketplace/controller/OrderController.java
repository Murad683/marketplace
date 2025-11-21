package az.marketplace.controller;

import az.marketplace.dto.order.CancelOrderRequest;
import az.marketplace.dto.order.OrderResponse;
import az.marketplace.dto.order.UpdateOrderStatusRequest;
import az.marketplace.entity.Customer;
import az.marketplace.entity.Merchant;
import az.marketplace.service.CurrentUserService;
import az.marketplace.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CurrentUserService currentUserService;

    @PostMapping("/orders")
    public ResponseEntity<List<OrderResponse>> createOrdersFromCart() {
        Customer customer = currentUserService.getCurrentCustomerOrThrow();
        return ResponseEntity.ok(orderService.createOrdersFromCart(customer));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getCustomerOrders() {
        Customer customer = currentUserService.getCurrentCustomerOrThrow();
        return ResponseEntity.ok(orderService.getOrdersForCustomer(customer));
    }

    @GetMapping("/merchant/orders")
    public ResponseEntity<List<OrderResponse>> getMerchantOrders() {
        Merchant merchant = currentUserService.getCurrentMerchantOrThrow();
        return ResponseEntity.ok(orderService.getOrdersForMerchant(merchant));
    }

    // Merchant status update: allow both PATCH and POST (PATCH can be blocked in some setups)
    @RequestMapping(
            path = "/merchant/orders/{orderId}/status",
            method = { RequestMethod.PATCH, RequestMethod.POST }
    )
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest req
    ) {
        Merchant merchant = currentUserService.getCurrentMerchantOrThrow();
        return ResponseEntity.ok(orderService.updateOrderStatus(merchant, orderId, req));
    }

    // ❗ Burada HƏM PATCH, HƏM POST qəbul edirik (dev/proxy-lərdə PATCH ilişə bilər)
    @RequestMapping(
            path = "/orders/{orderId}/cancel",
            method = { RequestMethod.PATCH, RequestMethod.POST }
    )
    public ResponseEntity<OrderResponse> cancelByCustomer(
            @PathVariable Long orderId,
            @Valid @RequestBody CancelOrderRequest req
    ) {
        Customer customer = currentUserService.getCurrentCustomerOrThrow();
        return ResponseEntity.ok(
                orderService.cancelOrderByCustomer(customer, orderId)
        );
    }
}
