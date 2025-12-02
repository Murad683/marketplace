package az.marketplace.exception;

import lombok.Getter;

@Getter
public class BalanceException extends RuntimeException {

    private final String code;

    public BalanceException(String code, String message) {
        super(message);
        this.code = code;
    }
}
