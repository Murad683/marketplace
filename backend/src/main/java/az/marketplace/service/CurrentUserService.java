package az.marketplace.service;

import az.marketplace.entity.Customer;
import az.marketplace.entity.Merchant;
import az.marketplace.entity.User;
import az.marketplace.entity.enums.UserType;
import az.marketplace.exception.AccessDeniedException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.CustomerRepository;
import az.marketplace.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final MerchantRepository merchantRepository;
    private final CustomerRepository customerRepository;

    private Authentication getAuthenticationOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return auth;
    }

    public User getCurrentUserOrThrow() {
        Authentication auth = getAuthenticationOrThrow();

        Object principal = auth.getPrincipal();
        if (!(principal instanceof User user)) {
            throw new AccessDeniedException("Invalid security principal");
        }

        return user;
    }

    public String getCurrentEmail() {
        Authentication auth = getAuthenticationOrThrow();
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) {
            return u.getEmail();
        }
        return auth.getName();
    }

    public Merchant getCurrentMerchantOrThrow() {
        User user = getCurrentUserOrThrow();

        if (user.getType() != UserType.MERCHANT) {
            throw new AccessDeniedException("Only merchant can access this resource");
        }

        return merchantRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new NotFoundException("Merchant not found for user"));
    }

    public Customer getCurrentCustomerOrThrow() {
        User user = getCurrentUserOrThrow();

        if (user.getType() != UserType.CUSTOMER) {
            throw new AccessDeniedException("Only customer can access this resource");
        }

        return customerRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new NotFoundException("Customer not found for user"));
    }

    public boolean canManageProducts(String ownerEmail) {
        // merchant öz məhsulunu idarə edə bilər
        String me = getCurrentEmail();
        return me != null && me.equalsIgnoreCase(ownerEmail);
    }

    public boolean canManageOrders() {
        User user = getCurrentUserOrThrow();
        return user.getType() == UserType.MERCHANT;
    }
}
