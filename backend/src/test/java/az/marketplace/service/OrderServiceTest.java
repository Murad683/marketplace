package az.marketplace.service;

import az.marketplace.entity.*;
import az.marketplace.entity.enums.OrderStatus;
import az.marketplace.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import az.marketplace.exception.BalanceException;
import az.marketplace.dto.order.UpdateOrderStatusRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private BalanceService balanceService;

    @InjectMocks
    private OrderService orderService;

    private Customer customer;
    private User user;
    private Product product;
    private Cart cart;
    private Merchant merchant;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        user = User.builder().id(1L).email("murad@example.com").build();
        customer = Customer.builder().id(1L).user(user).build();
        product = Product.builder().id(5L).price(new BigDecimal("100.00")).name("Phone").build();
        cart = Cart.builder().id(3L).user(user).build();
        merchant = Merchant.builder().id(8L).user(User.builder().id(9L).build()).build();
        product.setMerchant(merchant);
    }

    @Test
    void createOrdersFromCart_shouldCalculateTotalAmount() {
        CartItem item = CartItem.builder().id(7L).cart(cart).product(product).count(2).build();
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart(cart)).thenReturn(List.of(item));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);
        when(balanceService.debitForOrder(customer, new BigDecimal("200.00"))).thenReturn(customer);

        var orders = orderService.createOrdersFromCart(customer);

        assertEquals(1, orders.size());
        assertEquals(new BigDecimal("200.00"), orders.get(0).getTotalAmount());
        assertEquals(OrderStatus.PAID_FROM_BALANCE, orders.get(0).getStatus());
        verify(cartItemRepository, times(1)).deleteAll(any());
        verify(balanceService, times(1)).debitForOrder(customer, new BigDecimal("200.00"));
    }

    @Test
    void createOrdersFromCart_shouldFailWhenBalanceInsufficient() {
        CartItem item = CartItem.builder().id(7L).cart(cart).product(product).count(2).build();
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart(cart)).thenReturn(List.of(item));
        when(balanceService.debitForOrder(customer, new BigDecimal("200.00")))
                .thenThrow(new BalanceException("INSUFFICIENT_BALANCE", "Your balance is not enough to cover this order"));

        assertThrows(BalanceException.class, () -> orderService.createOrdersFromCart(customer));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelOrderByCustomer_shouldRefundWhenPaidFromBalance() {
        Order order = Order.builder()
                .id(11L)
                .customer(customer)
                .product(product)
                .count(1)
                .status(OrderStatus.PAID_FROM_BALANCE)
                .totalAmount(new BigDecimal("100.00"))
                .build();

        when(orderRepository.findById(11L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        orderService.cancelOrderByCustomer(customer, 11L);

        verify(balanceService, times(1)).credit(customer, new BigDecimal("100.00"));
    }

    @Test
    void updateOrderStatus_shouldRefundWhenMerchantRejectsPaidOrder() {
        Order order = Order.builder()
                .id(12L)
                .customer(customer)
                .product(product)
                .count(1)
                .status(OrderStatus.PAID_FROM_BALANCE)
                .totalAmount(new BigDecimal("150.00"))
                .build();

        when(orderRepository.findById(12L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        UpdateOrderStatusRequest req = UpdateOrderStatusRequest.builder()
                .status(OrderStatus.REJECT_BY_MERCHANT)
                .build();

        orderService.updateOrderStatus(merchant, 12L, req);

        verify(balanceService, times(1)).credit(customer, new BigDecimal("150.00"));
    }
}
