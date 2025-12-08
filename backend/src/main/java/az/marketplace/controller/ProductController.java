package az.marketplace.controller;

import az.marketplace.dto.product.ProductRequest;
import az.marketplace.dto.product.ProductResponse;
import az.marketplace.dto.product.ProductPhotoResponse;
import az.marketplace.entity.Merchant;
import az.marketplace.service.CurrentUserService;
import az.marketplace.service.ProductService;
import az.marketplace.service.ProductPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/products", "/api/products"})
public class ProductController {

    private final ProductService productService;
    private final CurrentUserService currentUserService;
    private final ProductPhotoService productPhotoService;

    // GET /products  → public
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAll() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // GET /products/{id} → public
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    // POST /products → only MERCHANT
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<ProductResponse> create(
            @Valid @ModelAttribute ProductRequest req,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        Merchant merchant = currentUserService.getCurrentMerchantOrThrow();
        return ResponseEntity.ok(productService.createProduct(req, images, merchant));
    }

    // PUT /products/{id} → only MERCHANT
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<ProductResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest req
    ) {
        Merchant merchant = currentUserService.getCurrentMerchantOrThrow();
        return ResponseEntity.ok(productService.updateProduct(id, req, merchant));
    }

    // DELETE /products/{id} → only MERCHANT
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Merchant merchant = currentUserService.getCurrentMerchantOrThrow();
        productService.deleteProduct(id, merchant);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{productId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MERCHANT')")
    public ResponseEntity<ProductPhotoResponse> uploadPhoto(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file
    ) {
        currentUserService.getCurrentMerchantOrThrow();
        ProductPhotoResponse response = productPhotoService.addPhoto(productId, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{productId}/photos/{photoId}")
    public ResponseEntity<Void> getPhoto(
            @PathVariable Long productId,
            @PathVariable Long photoId
    ) {
        var photo = productPhotoService.getPhotoOrThrow(productId, photoId);

        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(photo.getPhotoUrl()))
                .build();
    }
}