package az.marketplace.dto.product;

import jakarta.validation.constraints.NotBlank;

public record ProductPhotoRequest(
        @NotBlank String photoUrl
) {}
