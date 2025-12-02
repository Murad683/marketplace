package az.marketplace.service;

import az.marketplace.entity.Customer;
import az.marketplace.exception.BalanceException;
import az.marketplace.exception.NotFoundException;
import az.marketplace.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private static final String NO_BALANCE_CODE = "NO_BALANCE";
    private static final String INSUFFICIENT_CODE = "INSUFFICIENT_BALANCE";

    private final CustomerRepository customerRepository;

    @Transactional
    public Customer debitForOrder(Customer customer, BigDecimal amount) {
        if (customer == null || customer.getId() == null) {
            throw new IllegalArgumentException("Customer is required");
        }
        BigDecimal total = requireNonNegative(amount);

        Customer managed = customerRepository.findByIdForUpdate(customer.getId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        BigDecimal balance = Optional.ofNullable(managed.getBalance()).orElse(BigDecimal.ZERO);

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BalanceException(NO_BALANCE_CODE, "You have no balance to continue order");
        }

        if (balance.compareTo(total) < 0) {
            throw new BalanceException(INSUFFICIENT_CODE, "Your balance is not enough to cover this order");
        }

        BigDecimal newBalance = balance.subtract(total);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BalanceException(INSUFFICIENT_CODE, "Your balance is not enough to cover this order");
        }

        managed.setBalance(newBalance);
        return customerRepository.save(managed);
    }

    @Transactional
    public Customer credit(Customer customer, BigDecimal amount) {
        if (customer == null || customer.getId() == null) {
            throw new IllegalArgumentException("Customer is required");
        }
        BigDecimal creditAmount = requirePositive(amount);

        Customer managed = customerRepository.findByIdForUpdate(customer.getId())
                .orElseThrow(() -> new NotFoundException("Customer not found"));

        BigDecimal balance = Optional.ofNullable(managed.getBalance()).orElse(BigDecimal.ZERO);
        managed.setBalance(balance.add(creditAmount));
        return customerRepository.save(managed);
    }

    private BigDecimal requireNonNegative(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount must not be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount must not be negative");
        }
        return amount;
    }

    private BigDecimal requirePositive(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        return amount;
    }
}
