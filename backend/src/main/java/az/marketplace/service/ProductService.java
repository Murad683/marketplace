package az.marketplace.service;

import az.marketplace.dto.product.ProductRequest;
import az.marketplace.dto.product.ProductResponse;
import az.marketplace.entity.Category;
import az.marketplace.entity.Merchant;
import az.marketplace.entity.Product;
import az.marketplace.entity.ProductPhoto;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.CategoryRepository;
import az.marketplace.repository.OrderRepository;
import az.marketplace.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        return toProductResponse(product);
    }

    private static final Path UPLOAD_ROOT = Path.of("/app/uploads");

    @Transactional
    public ProductResponse createProduct(ProductRequest req, List<MultipartFile> images, Merchant merchant) {
        validateProductRequest(req);

        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found"));

        Product product = Product.builder()
                .name(req.getName())
                .details(req.getDetails())
                .price(req.getPrice())
                .stockCount(req.getStockCount())
                .category(category)
                .merchant(merchant)
                .build();

        if (images != null && !images.isEmpty()) {
            List<ProductPhoto> photos = new ArrayList<>();
            for (MultipartFile image : images) {
                if (image == null || image.isEmpty()) continue;
                String storedPath = storeImage(image);
                ProductPhoto photo = ProductPhoto.builder()
                        .product(product)
                        .photoUrl(storedPath)
                        .build();
                photos.add(photo);
            }
            if (!photos.isEmpty()) {
                product.setPhotos(photos);
            }
        }

        product = productRepository.save(product);
        return toProductResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, ProductRequest req, Merchant actingMerchant) {
        validateProductRequest(req);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        String ownerEmail = product.getMerchant().getUser().getEmail();

        if (!currentUserService.canManageProducts(ownerEmail)) {
            throw new AccessDeniedException("You cannot modify this product");
        }

        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found"));

        product.setName(req.getName());
        product.setDetails(req.getDetails());
        product.setPrice(req.getPrice());
        product.setStockCount(req.getStockCount());
        product.setCategory(category);

        product = productRepository.save(product);
        return toProductResponse(product);
    }

    @Transactional
    public void deleteProduct(Long productId, Merchant actingMerchant) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        String ownerEmail = product.getMerchant().getUser().getEmail();

        if (!currentUserService.canManageProducts(ownerEmail)) {
            throw new AccessDeniedException("You cannot delete this product");
        }

        boolean referencedInOrders = orderRepository.existsByProduct_Id(productId);
        if (referencedInOrders) {
            throw new AccessDeniedException(
                    "This product is already part of existing orders and cannot be deleted"
            );
        }

        productRepository.delete(product);
    }

    private void validateProductRequest(ProductRequest req) {
        if (req.getPrice() == null || req.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
        if (req.getStockCount() == null || req.getStockCount() < 0) {
            throw new IllegalArgumentException("Stock count cannot be negative");
        }
    }

    private String storeImage(MultipartFile file) {
        try {
            Files.createDirectories(UPLOAD_ROOT);
            String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot != -1 && dot < original.length() - 1) {
                ext = original.substring(dot);
            }
            String filename = UUID.randomUUID() + ext;
            Path target = UPLOAD_ROOT.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store image", e);
        }
    }

    // Mapper
    public ProductResponse toProductResponse(Product product) {
        List<String> photoUrls = new ArrayList<>();
        if (product.getPhotos() != null) {
            for (ProductPhoto ph : product.getPhotos()) {
                if (ph != null && ph.getPhotoUrl() != null) photoUrls.add(ph.getPhotoUrl());
            }
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .details(product.getDetails())
                .price(product.getPrice())
                .stockCount(product.getStockCount())
                .merchantId(product.getMerchant().getId())
                .merchantCompanyName(product.getMerchant().getCompanyName())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .photoUrls(photoUrls)
                .createdAt(product.getCreatedAt())   // <<=== ƏSAS SƏTİR
                .build();
    }
}
