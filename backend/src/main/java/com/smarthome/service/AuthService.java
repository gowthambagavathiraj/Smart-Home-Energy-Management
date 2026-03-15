package com.smarthome.service;

import com.smarthome.dto.*;
import com.smarthome.model.EmailVerificationToken;
import com.smarthome.model.PasswordResetToken;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.DeviceScheduleRepository;
import com.smarthome.repository.EmailVerificationTokenRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import com.smarthome.repository.NotificationRepository;
import com.smarthome.repository.PasswordResetTokenRepository;
import com.smarthome.repository.UserRepository;
import com.smarthome.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationConfiguration authenticationConfiguration;
    private final EmailService emailService;
    private final DeviceRepository deviceRepository;
    private final DeviceScheduleRepository deviceScheduleRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;
    private final NotificationRepository notificationRepository;

    @Value("${app.reset-code.expiry-ms:600000}")
    private long resetCodeExpiryMs;

    private final AdminRoleService adminRoleService;
    private final LoginAuditService loginAuditService;

    // ========== REGISTRATION ==========
    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("An account with this email already exists");
        }

        // Validate password (letters and numbers only - extra server-side check)
        if (!request.getPassword().matches("^[a-zA-Z0-9]+$")) {
            throw new RuntimeException("Password must contain only letters and numbers");
        }

        // Never allow client-side self-escalation to ADMIN.
        User.Role requestedRole = request.getRole() != null ? request.getRole() : User.Role.HOMEOWNER;
        User.Role role = adminRoleService.resolveRoleByEmail(request.getEmail(), requestedRole);

        // Create user
        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(User.AuthProvider.LOCAL)
                .role(role)
                .active(true)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        sendVerificationCode(savedUser.getEmail(), savedUser.getFirstName());

        return AuthResponseDto.builder()
                .token(null)
                .user(mapToUserDto(savedUser))
                .message("Account created. Please verify your email with the 6-digit code sent to your inbox.")
                .build();
    }

    // ========== LOGIN ==========
    public AuthResponseDto login(LoginRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled. Please contact support.");
        }

        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new RuntimeException("Password is required.");
            }
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in.");
        }

        try {
            authenticationConfiguration.getAuthenticationManager().authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password");
        } catch (Exception e) {
            log.error("Authentication manager failed for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Authentication system error. Please try again.");
        }

        User.Role resolvedRole = adminRoleService.resolveRoleByEmail(user.getEmail(), user.getRole());
        if (user.getRole() != resolvedRole) {
            user.setRole(resolvedRole);
            userRepository.save(user);
        }

        loginAuditService.registerSuccessfulLogin(user);

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponseDto.builder()
                .token(token)
                .user(mapToUserDto(user))
                .message("Login successful")
                .build();
    }

    // ========== FORGOT PASSWORD ==========
    @Transactional
    public ApiResponseDto forgotPassword(ForgotPasswordRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address"));

        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            throw new RuntimeException("This account uses Google Sign-In. Password reset is not applicable.");
        }

        // Delete existing reset tokens for this email
        tokenRepository.deleteAllByEmail(email);

        // Generate 6-digit code
        String code = generateSixDigitCode();

        // Calculate expiry
        LocalDateTime expiresAt = LocalDateTime.now().plusNanos(resetCodeExpiryMs * 1_000_000L);

        // Save token
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .code(code)
                .email(email)
                .expiresAt(expiresAt)
                .used(false)
                .verified(false)
                .build();

        tokenRepository.save(resetToken);

        // Send email
        emailService.sendPasswordResetCode(email, user.getFirstName(), code);

        return new ApiResponseDto(true, "Reset code sent to your email. Please check your inbox.");
    }

    @Transactional
    public ApiResponseDto verifyEmail(VerifyCodeRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address"));

        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            throw new RuntimeException("Google account does not require email code verification.");
        }
        if (user.isEmailVerified()) {
            return new ApiResponseDto(true, "Email is already verified.");
        }

        EmailVerificationToken token = emailVerificationTokenRepository
                .findByEmailAndCodeAndUsedFalse(email, request.getCode())
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification code"));

        if (token.isExpired()) {
            emailVerificationTokenRepository.delete(token);
            throw new RuntimeException("Verification code has expired. Please request a new one.");
        }

        token.setUsed(true);
        emailVerificationTokenRepository.save(token);

        user.setEmailVerified(true);
        userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
        } catch (Exception e) {
            log.warn("Welcome email failed to send for {}: {}", user.getEmail(), e.getMessage());
        }

        return new ApiResponseDto(true, "Email verified successfully. You can now login.");
    }

    @Transactional
    public ApiResponseDto resendEmailVerification(ForgotPasswordRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address"));

        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            throw new RuntimeException("Google account does not require email code verification.");
        }
        if (user.isEmailVerified()) {
            return new ApiResponseDto(true, "Email is already verified.");
        }

        sendVerificationCode(user.getEmail(), user.getFirstName());
        return new ApiResponseDto(true, "Verification code sent. Please check your inbox.");
    }

    // ========== VERIFY RESET CODE ==========
    @Transactional
    public ApiResponseDto verifyResetCode(VerifyCodeRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();

        PasswordResetToken token = tokenRepository
                .findByEmailAndCodeAndUsedFalseAndVerifiedFalse(email, request.getCode())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset code"));

        if (token.isExpired()) {
            tokenRepository.delete(token);
            throw new RuntimeException("Reset code has expired. Please request a new one.");
        }

        // Mark as verified (but not used yet - used after actual reset)
        token.setVerified(true);
        tokenRepository.save(token);

        return new ApiResponseDto(true, "Code verified successfully. You may now set a new password.");
    }

    // ========== RESET PASSWORD ==========
    @Transactional
    public ApiResponseDto resetPassword(ResetPasswordRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();

        // Find verified token
        PasswordResetToken token = tokenRepository
                .findByEmailAndCodeAndUsedFalseAndVerifiedTrue(email, request.getCode())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset code. Please verify again."));

        if (token.isExpired()) {
            tokenRepository.delete(token);
            throw new RuntimeException("Reset code has expired. Please request a new one.");
        }

        // Validate new password
        if (!request.getNewPassword().matches("^[a-zA-Z0-9]+$")) {
            throw new RuntimeException("Password must contain only letters and numbers");
        }

        // Update user password
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        token.setUsed(true);
        tokenRepository.save(token);

        log.info("Password reset successful for email: {}", email);

        return new ApiResponseDto(true, "Password reset successfully. You can now sign in with your new password.");
    }

    // ========== GET CURRENT USER ==========
    public UserResponseDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserDto(user);
    }

    @Transactional
    public UserResponseDto updateProfile(String email, UserProfileUpdateRequestDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request == null) {
            throw new RuntimeException("Profile data is required");
        }
        String firstName = request.getFirstName() != null ? request.getFirstName().trim() : "";
        String lastName = request.getLastName() != null ? request.getLastName().trim() : "";
        if (firstName.isEmpty() || lastName.isEmpty()) {
            throw new RuntimeException("First name and last name are required");
        }

        user.setFirstName(firstName);
        user.setLastName(lastName);
        User saved = userRepository.save(user);
        return mapToUserDto(saved);
    }

    @Transactional
    public ApiResponseDto deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("Admin account cannot be deleted here.");
        }

        Long userId = user.getId();
        var deviceIds = deviceRepository.findByUserId(userId).stream()
                .map(device -> device.getId())
                .toList();

        if (!deviceIds.isEmpty()) {
            energyUsageLogRepository.deleteByDeviceIdIn(deviceIds);
            deviceScheduleRepository.deleteByDeviceIdIn(deviceIds);
        }
        deviceScheduleRepository.deleteByUserId(userId);
        notificationRepository.deleteByUserId(userId);
        emailVerificationTokenRepository.deleteAllByEmail(email);
        tokenRepository.deleteAllByEmail(email);
        deviceRepository.deleteByUserId(userId);
        userRepository.delete(user);

        return new ApiResponseDto(true, "Account deleted successfully");
    }

    // ========== HELPER: Generate 6-digit code ==========
    private String generateSixDigitCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    // ========== HELPER: Map User to DTO ==========
    private UserResponseDto mapToUserDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .provider(user.getProvider().name())
                .role(user.getRole().name())
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .loginCount(user.getLoginCount())
                .build();
    }

    private void sendVerificationCode(String email, String firstName) {
        emailVerificationTokenRepository.deleteAllByEmail(email);
        String code = generateSixDigitCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusNanos(resetCodeExpiryMs * 1_000_000L);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .email(email)
                .code(code)
                .expiresAt(expiresAt)
                .used(false)
                .build();
        emailVerificationTokenRepository.save(token);
        emailService.sendEmailVerificationCode(email, firstName, code);
    }


    // ========== SCHEDULED: Clean up expired tokens ==========
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        emailVerificationTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.debug("Cleaned up expired password reset tokens");
    }
}
