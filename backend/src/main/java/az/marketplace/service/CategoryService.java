package az.marketplace.service;

import az.marketplace.dto.product.CategoryRequest;
import az.marketplace.dto.product.CategoryResponse;
import az.marketplace.entity.Category;
import az.marketplace.entity.enums.UserType;
import az.marketplace.entity.User;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {

        // icazə ancaq MERCHANT
        User me = currentUserService.getCurrentUserOrThrow();
        if (me.getType() != UserType.MERCHANT) {
            throw new AccessDeniedException("Only merchant can create categories");
        }

        categoryRepository.findByName(request.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Category with this name already exists");
                });

        Category category = Category.builder()
                .name(request.getName())
                .build();

        category = categoryRepository.save(category);

        return toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Category getEntityById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}