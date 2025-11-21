package az.marketplace.service;

import az.marketplace.entity.*;
import az.marketplace.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

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

    @InjectMocks
    private OrderService orderService;

    private Customer customer;
    private User user;
    private Product product;
    private Cart cart;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        user = User.builder().id(1L).email("murad@example.com").build();
        customer = Customer.builder().id(1L).user(user).build();
        product = Product.builder().id(5L).price(new BigDecimal("100.00")).name("Phone").build();
        cart = Cart.builder().id(3L).user(user).build();
    }

    @Test
    void createOrdersFromCart_shouldCalculateTotalAmount() {
        CartItem item = CartItem.builder().id(7L).cart(cart).product(product).count(2).build();
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart(cart)).thenReturn(List.of(item));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        var orders = orderService.createOrdersFromCart(customer);

        assertEquals(1, orders.size());
        assertEquals(new BigDecimal("200.00"), orders.get(0).getTotalAmount());
        verify(cartItemRepository, times(1)).deleteAll(any());
    }
}
