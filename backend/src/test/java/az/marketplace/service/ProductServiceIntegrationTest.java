package az.marketplace.service;

import az.marketplace.dto.product.ProductRequest;
import az.marketplace.dto.product.ProductResponse;
import az.marketplace.entity.Category;
import az.marketplace.entity.Merchant;
import az.marketplace.entity.Product;
import az.marketplace.entity.User;
import az.marketplace.entity.enums.UserType;
import az.marketplace.repository.CategoryRepository;
import az.marketplace.repository.MerchantRepository;
import az.marketplace.repository.ProductRepository;
import az.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class ProductServiceIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    private Merchant merchant;
    private Category category;

    @BeforeEach
    void setup() {
        // 1. User yarat (Merchant üçün)
        User user = User.builder()
                .email("merchantUser@example.com")
                .password("encodedpass") // test üçün hər şey olar
                .name("Test")
                .surname("Seller")
                .type(UserType.MERCHANT) // səndə enum necə adlanırsa onu istifadə elə
                .build();
        user = userRepository.save(user);

        // 2. Merchant yarat və user-ə bağla
        merchant = Merchant.builder()
                .companyName("Test Seller LLC")
                .user(user)
                .build();
        merchant = merchantRepository.save(merchant);

        // 3. Category yarat
        category = Category.builder()
                .name("Test Category")
                .build();
        category = categoryRepository.save(category);
    }

    @Test
    void createProduct_shouldPersistAndReturnResponse() {
        ProductRequest req = new ProductRequest();
        req.setName("PlayStation 5");
        req.setDetails("Digital Edition");
        req.setPrice(new BigDecimal("999.99"));
        req.setStockCount(7);
        req.setCategoryId(category.getId());

        ProductResponse response = productService.createProduct(req, null, merchant);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getName()).isEqualTo("PlayStation 5");
        assertThat(response.getCategoryName()).isEqualTo("Test Category");
        assertThat(response.getMerchantCompanyName()).isEqualTo("Test Seller LLC");
        assertThat(response.getPhotoUrls()).isEmpty();

        Product fromDb = productRepository.findById(response.getId()).orElseThrow();
        assertThat(fromDb.getName()).isEqualTo("PlayStation 5");
        assertThat(fromDb.getPhotos()).isNullOrEmpty();
    }

    @Test
    void getAllProducts_shouldReturnCreatedProducts() {
        Product p = Product.builder()
                .name("BMW X5")
                .details("Black, 2022, full package")
                .price(new BigDecimal("150000.00"))
                .stockCount(3)
                .merchant(merchant)
                .category(category)
                .build();
        productRepository.save(p);

        List<ProductResponse> all = productService.getAllProducts();

        assertThat(all).hasSize(1);
        ProductResponse first = all.get(0);

        assertThat(first.getName()).isEqualTo("BMW X5");
        assertThat(first.getMerchantCompanyName()).isEqualTo("Test Seller LLC");
        assertThat(first.getCategoryName()).isEqualTo("Test Category");
    }
}
