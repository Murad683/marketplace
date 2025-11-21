package az.marketplace.service;

import az.marketplace.dto.product.ProductPhotoResponse;
import az.marketplace.entity.Product;
import az.marketplace.entity.ProductPhoto;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.ProductPhotoRepository;
import az.marketplace.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductPhotoService {

    private final ProductRepository productRepository;
    private final ProductPhotoRepository productPhotoRepository;
    private final CurrentUserService currentUserService;

    private static final Path UPLOAD_ROOT = Path.of("/app/uploads");

    @Transactional
    public ProductPhotoResponse addPhoto(Long productId, MultipartFile file) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        String ownerEmail = product.getMerchant().getUser().getEmail();

        if (!currentUserService.canManageProducts(ownerEmail)) {
            throw new AccessDeniedException("You cannot attach photo for this product");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("image file is required");
        }

        String storedPath = storeImage(file);

        ProductPhoto photo = ProductPhoto.builder()
                .product(product)
                .photoUrl(storedPath)
                .build();

        photo = productPhotoRepository.save(photo);
        return new ProductPhotoResponse(photo.getId(), photo.getPhotoUrl());
    }

    @Transactional(readOnly = true)
    public ProductPhoto getPhotoOrThrow(Long productId, Long photoId) {
        ProductPhoto photo = productPhotoRepository.findById(photoId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));

        if (!photo.getProduct().getId().equals(productId)) {
            throw new NotFoundException("Photo does not belong to this product");
        }

        return photo;
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
}
