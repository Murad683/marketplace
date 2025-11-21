package az.marketplace.config;

import az.marketplace.entity.enums.UserType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public String generateToken(String email, UserType role) {
        Map<String, Object> extraClaims = Map.of(
                "role", role != null ? role.name() : null
        );
        return buildToken(extraClaims, email);
    }

    private String buildToken(Map<String, Object> extraClaims, String email) {
        Date now = Date.from(Instant.now());
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        Object role = claims.get("role");
        return role == null ? null : role.toString();
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        String email = extractEmail(token);
        return (email != null
                && email.equals(expectedEmail)
                && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Secret string-i (məs: "change_me") götürürük,
     * SHA-256 hash-ə çeviririk, ilk 32 byte-dan HMAC açarı düzəldirik.
     * Bu artıq Base64 tələb etmir və sabitdir.
     */
    private SecretKey getSignKey() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] raw = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
            // raw artıq 32 byte olacaq
            return new SecretKeySpec(raw, "HmacSHA256");
        } catch (Exception e) {
            throw new RuntimeException("Failed to build JWT signing key", e);
        }
    }
}
