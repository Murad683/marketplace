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

    /**
     * Helper: hazır auth obyektini qaytarır.
     */
    private Authentication getAuthenticationOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return auth;
    }

    /**
     * Helper: sistemdəki aktiv istifadəçinin (SecurityContext-də olan) domen User obyektini qaytarır.
     * Burada biz gözləyirik ki SecurityConfig düzgün şəkildə principal kimi bizim User obyektimizi qoyub.
     */
    public User getCurrentUserOrThrow() {
        Authentication auth = getAuthenticationOrThrow();

        Object principal = auth.getPrincipal();
        if (!(principal instanceof User user)) {
            throw new AccessDeniedException("Invalid security principal");
        }

        return user;
    }

    /**
     * Helper: hazır email lazımdırsa.
     * Bu, superuser yoxlaması üçün rahatdır.
     */
    public String getCurrentEmail() {
        Authentication auth = getAuthenticationOrThrow();
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) {
            return u.getEmail();
        }
        // fallback: e.g. principal = String
        return auth.getName();
    }

    /**
     * Bizim xüsusi qaydamız:
     * email "murad" olan istifadəçi platformadakı HƏR ŞEYİ idarə edə bilir.
     * Yəni bu super admin kimidir (root).
     */
    public boolean isSuperUser() {
        String email = getCurrentEmail();
        return email != null && (email.equalsIgnoreCase("murad") || email.equalsIgnoreCase("murad@marketplace.local"));
    }

    /**
     * Hazır istifadəçinin MERCHANT-ə uyğun Merchant entitisini qaytarır.
     * Əgər superuser-dirsə, merchant qaytarmırıq çünki o öz-özlüyündə məcburi merchant olmaya bilər.
     * Amma superuser istənilən merchant əməliyyatını edə bilər, bunu controller/service səviyyəsində yoxlayacağıq.
     */
    public Merchant getCurrentMerchantOrThrow() {
        User user = getCurrentUserOrThrow();

        if (user.getType() != UserType.MERCHANT) {
            // superuser isə bu blok onu saxlamasın deyə, merchant soruşulanda nə edirik?
            // Variant A: superuser üçün də merchant axtarmağa çalışmayaq → sadəcə bu xətanı atmadan davam etmək istəyirsənsə,
            // bunu dəyişə bilərik. Amma klassik davranış budur:
            if (!isSuperUser()) {
                throw new AccessDeniedException("Only merchant can access this resource");
            }
            // superuser-ə xüsusi "merchant" lazımdırsa, burada ya null qaytarmalısan, ya ayrıca seçim.
            // Biz indi null qaytarmayaq, çünki əks halda kod patlaya bilər.
            // Ona görə superuser bu metodu istifadə etmək istəsə də əslində
            // ProductService kimi yerdə ayrıca icazə check edəcəyik.
        }

        return merchantRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new NotFoundException("Merchant not found for user"));
    }

    /**
     * CUSTOMER üçün Customer entity qaytarır.
     */
    public Customer getCurrentCustomerOrThrow() {
        User user = getCurrentUserOrThrow();

        if (user.getType() != UserType.CUSTOMER) {
            if (!isSuperUser()) {
                throw new AccessDeniedException("Only customer can access this resource");
            }
            // superuser müştəri deyil, amma yenə izn vermək istəsək, eyni mövzu.
        }

        return customerRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new NotFoundException("Customer not found for user"));
    }

    /**
     * Bu helper-ləri biz service-lərdə istifadə edə bilərik
     * məsələn ProductService-də:
     * if(!currentUserService.canManageProducts(productOwnerUsername)) throw AccessDeniedException...
     */
    public boolean canManageProducts(String ownerEmail) {
        // superuser hər şeyi idarə edə bilir
        if (isSuperUser()) return true;

        // merchant öz məhsulunu idarə edə bilər
        String me = getCurrentEmail();
        return me != null && me.equalsIgnoreCase(ownerEmail);
    }

    /**
     * Sifarişləri kim idarə edə bilir?
     * - superuser → hamısını idarə etsin
     * - merchant → öz məhsullarına gələn sifarişləri idarə etsin
     * (bu konkret "merchant orders" məntiqində istifadə olunacaq)
     *
     * Burada sadə cavab veririk: superuser və ya MERCHANT olanlar sifariş idarə edə bilər.
     * Daha incə yoxlama (bu sifariş HƏQİQƏTƏN onun məhsuludursa?) artıq OrderService içində olacaq.
     */
    public boolean canManageOrders() {
        if (isSuperUser()) return true;
        User user = getCurrentUserOrThrow();
        return user.getType() == UserType.MERCHANT;
    }
}
