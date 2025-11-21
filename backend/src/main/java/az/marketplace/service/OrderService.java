package az.marketplace.service;

import az.marketplace.dto.order.OrderResponse;
import az.marketplace.dto.order.UpdateOrderStatusRequest;
import az.marketplace.entity.*;
import az.marketplace.entity.enums.OrderStatus;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.CartItemRepository;
import az.marketplace.repository.CartRepository;
import az.marketplace.repository.OrderRepository;
import az.marketplace.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    @Transactional
    public List<OrderResponse> createOrdersFromCart(Customer customer) {

        Cart cart = cartRepository.findByUser(customer.getUser())
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        List<CartItem> items = cartItemRepository.findByCart(cart);
        if (items.isEmpty()) return List.of();

        // validate stock
        for (CartItem item : items) {
            Product product = item.getProduct();
            int cnt = Optional.ofNullable(item.getCount()).orElse(0);
            int stock = Optional.ofNullable(product.getStockCount()).orElse(0);
            if (cnt <= 0) throw new IllegalArgumentException("Invalid quantity for " + product.getName());
            if (cnt > stock) throw new IllegalArgumentException("Product '" + product.getName() + "' only " + stock + " left");
        }

        List<Order> createdOrders = new ArrayList<>();
        LinkedHashSet<Product> touchedProducts = new LinkedHashSet<>();

        for (CartItem item : items) {
            Product p = item.getProduct();
            int cnt = Optional.ofNullable(item.getCount()).orElse(0);
            BigDecimal price = Optional.ofNullable(p.getPrice()).orElse(BigDecimal.ZERO);
            BigDecimal total = price.multiply(BigDecimal.valueOf(cnt));

            Order o = Order.builder()
                    .customer(customer)
                    .product(p)
                    .count(cnt)
                    .totalAmount(total)
                    .status(OrderStatus.CREATED)
                    .build();

            o = orderRepository.save(o);
            createdOrders.add(o);
            notificationService.notifyOrderCreated(o);

            p.setStockCount(Optional.ofNullable(p.getStockCount()).orElse(0) - cnt);
            touchedProducts.add(p);
        }

        productRepository.saveAll(touchedProducts);
        cartItemRepository.deleteAll(items);
        cart.setUpdatedAt(LocalDateTime.now());

        return createdOrders.stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForCustomer(Customer customer) {
        return orderRepository.findByCustomer(customer)
                .stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForMerchant(Merchant merchant) {
        return orderRepository.findOrdersForMerchant(merchant)
                .stream()
                .filter(o -> o.getStatus() != OrderStatus.REJECT_BY_CUSTOMER) // customer ləğv edibsə merchant görmür
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Merchant merchant, Long orderId, UpdateOrderStatusRequest req) {
        if (req.getStatus() == OrderStatus.REJECT_BY_CUSTOMER) {
            throw new IllegalArgumentException("Merchant cannot set status to REJECT_BY_CUSTOMER");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        Merchant owner = order.getProduct().getMerchant();
        if (!owner.getId().equals(merchant.getId())) {
            throw new AccessDeniedException("You cannot update this order");
        }

        OrderStatus prevStatus = order.getStatus();
        OrderStatus newStatus = req.getStatus();
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.REJECT_BY_MERCHANT
                && prevStatus != OrderStatus.REJECT_BY_MERCHANT
                && prevStatus != OrderStatus.REJECT_BY_CUSTOMER) {
            Product product = order.getProduct();
            int currentStock = Optional.ofNullable(product.getStockCount()).orElse(0);
            product.setStockCount(currentStock + Optional.ofNullable(order.getCount()).orElse(0));
            productRepository.save(product);
        }
        order = orderRepository.save(order);
        return toOrderResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrderByCustomer(Customer customer, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("You cannot cancel this order");
        }

        // Merchant artıq REJECT edibsə – müştəri yenidən ləğv edə bilməz
        if (order.getStatus() == OrderStatus.REJECT_BY_MERCHANT) {
            throw new IllegalArgumentException("This order is already rejected by merchant");
        }

        // Artıq ləğv olunmuşdursa, NO-OP kimi qaytarmaq da olar — burada error veririk:
        if (order.getStatus() == OrderStatus.REJECT_BY_CUSTOMER) {
            throw new IllegalArgumentException("This order is already cancelled by customer");
        }

        // Delivered və s. kimi final statusları da bloklayaq
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Delivered orders cannot be cancelled");
        }

        order.setStatus(OrderStatus.REJECT_BY_CUSTOMER);
        // restore stock because customer cancelled
        Product product = order.getProduct();
        int currentStock = Optional.ofNullable(product.getStockCount()).orElse(0);
        product.setStockCount(currentStock + Optional.ofNullable(order.getCount()).orElse(0));
        productRepository.save(product);

        order = orderRepository.save(order);

        return toOrderResponse(order);
    }

    private OrderResponse toOrderResponse(Order o) {
        return OrderResponse.builder()
                .orderId(o.getId())
                .productId(o.getProduct().getId())
                .productName(o.getProduct().getName())
                .count(o.getCount())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
