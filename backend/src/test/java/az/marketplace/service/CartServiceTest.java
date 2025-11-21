package az.marketplace.service;

import az.marketplace.dto.cart.AddToCartRequest;
import az.marketplace.entity.*;
import az.marketplace.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Disabled("Cart service test not finalized yet")
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private User user;
    private Customer customer;
    private Cart cart;
    private Product product;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        user = User.builder().id(1L).email("murad@example.com").build();
        customer = Customer.builder().user(user).build();
        cart = Cart.builder().id(1L).user(user).build();
        product = Product.builder().id(5L).name("Laptop").price(new BigDecimal("1000.00")).build();
    }

    @Test
    void addToCart_shouldIncreaseCountIfExists() {
        AddToCartRequest req = AddToCartRequest.builder().productId(5L).count(2).build();

        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartAndProduct(cart, product))
                .thenReturn(Optional.of(CartItem.builder().cart(cart).product(product).count(1).build()));

        var response = cartService.addToCart(customer, req);

        assertNotNull(response);
        assertEquals(3, response.getCount());
    }
}
