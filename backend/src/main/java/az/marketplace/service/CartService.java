package az.marketplace.service;

import az.marketplace.dto.cart.AddToCartRequest;
import az.marketplace.dto.cart.CartItemResponse;
import az.marketplace.entity.*;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.CartItemRepository;
import az.marketplace.repository.CartRepository;
import az.marketplace.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart c = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(c);
                });
    }

    @Transactional(readOnly = true)
    public List<CartItemResponse> getCartItems(Customer customer) {
        Cart cart = getOrCreateCart(customer.getUser());

        List<CartItem> items = cartItemRepository.findByCart(cart);

        return items.stream()
                .map(this::toCartItemResponse)
                .collect(Collectors.toList());
    }

    // 🔥 UPDATED METHOD: stock-aware addToCart with quantity
    @Transactional
    public CartItemResponse addToCart(Customer customer, AddToCartRequest req) {
        Cart cart = getOrCreateCart(customer.getUser());

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        // 1. count validation
        int addCount = req.getCount();
        if (addCount <= 0) {
            throw new IllegalArgumentException("Count must be >= 1");
        }

        // 2. find existing cart item OR build new
        CartItem item = cartItemRepository.findByCartAndProduct(cart, product)
                .orElse(
                        CartItem.builder()
                                .cart(cart)
                                .product(product)
                                .count(0)
                                .build()
                );

        int currentCount = (item.getCount() == null) ? 0 : item.getCount();
        int desiredTotal = currentCount + addCount;

        // 3. stock check
        Integer stock = product.getStockCount();
        if (stock == null) {
            stock = 0;
        }

        if (desiredTotal > stock) {
            throw new IllegalArgumentException(
                    "Only " + stock + " left in stock. " +
                            "You already have " + currentCount + " in cart. " +
                            "Cannot add " + addCount + " more."
            );
        }

        // 4. persist
        item.setCount(desiredTotal);
        item = cartItemRepository.save(item);
        cart.setUpdatedAt(LocalDateTime.now());

        return toCartItemResponse(item);
    }

    @Transactional
    public void removeItem(Customer customer, Long itemId) {
        Cart cart = getOrCreateCart(customer.getUser());

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Item does not belong to your cart");
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartItemRepository.delete(item);
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        BigDecimal unitPrice = item.getProduct().getPrice() != null
                ? item.getProduct().getPrice()
                : BigDecimal.ZERO;
        int count = item.getCount() == null ? 0 : item.getCount();
        return CartItemResponse.builder()
                .itemId(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .count(count)
                .pricePerUnit(unitPrice)
                .totalPrice(unitPrice.multiply(BigDecimal.valueOf(count)))
                .build();
    }
}
