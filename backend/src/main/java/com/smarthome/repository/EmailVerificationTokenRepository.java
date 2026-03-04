package com.smarthome.repository;

import com.smarthome.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByEmailAndCodeAndUsedFalse(String email, String code);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken t WHERE t.email = :email")
    void deleteAllByEmail(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);
}
