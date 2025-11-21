package az.marketplace.service;

import az.marketplace.dto.product.ProductRequest;
import az.marketplace.entity.*;
import az.marketplace.repository.CategoryRepository;
import az.marketplace.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Merchant merchant;
    private Category category;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        merchant = Merchant.builder().id(1L).companyName("Shop").build();
        category = Category.builder().id(1L).name("Tech").build();
    }

    @Test
    void createProduct_shouldSaveProduct() {
        ProductRequest req = ProductRequest.builder()
                .categoryId(1L)
                .name("Phone")
                .details("Android")
                .price(new BigDecimal("1000.00"))
                .stockCount(5)
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArguments()[0]);

        var result = productService.createProduct(req, null, merchant);

        assertNotNull(result);
        assertEquals("Phone", result.getName());
        assertEquals(merchant.getCompanyName(), result.getMerchantCompanyName());
    }
}
