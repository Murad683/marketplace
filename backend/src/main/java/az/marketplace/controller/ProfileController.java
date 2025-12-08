package az.marketplace.controller;

import az.marketplace.dto.customer.CustomerProfileResponse;
import az.marketplace.dto.merchant.MerchantProfileResponse;
import az.marketplace.entity.Customer;
import az.marketplace.entity.Merchant;
import az.marketplace.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final CurrentUserService currentUserService;

    @GetMapping("/me")
    public ResponseEntity<CustomerProfileResponse> getCurrentCustomer() {
        Customer customer = currentUserService.getCurrentCustomerOrThrow();
        return ResponseEntity.ok(CustomerProfileResponse.from(customer));
    }

    @GetMapping("/merchant/me")
    public ResponseEntity<MerchantProfileResponse> getCurrentMerchant() {
        Merchant merchant = currentUserService.getCurrentMerchantOrThrow();
        return ResponseEntity.ok(MerchantProfileResponse.from(merchant));
    }
}