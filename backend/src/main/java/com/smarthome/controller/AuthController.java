package com.smarthome.controller;

import com.smarthome.dto.*;
import com.smarthome.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Register a new user account
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/forgot-password
     * Send password reset code to user's email
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponseDto> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto request) {
        ApiResponseDto response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/verify-reset-code
     * Verify the 6-digit reset code
     */
    @PostMapping("/verify-reset-code")
    public ResponseEntity<ApiResponseDto> verifyResetCode(@Valid @RequestBody VerifyCodeRequestDto request) {
        ApiResponseDto response = authService.verifyResetCode(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/reset-password
     * Reset user's password using verified code
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponseDto> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request) {
        ApiResponseDto response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/verify-email
     * Verify registration email with 6-digit code
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponseDto> verifyEmail(@Valid @RequestBody VerifyCodeRequestDto request) {
        ApiResponseDto response = authService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/resend-verification
     * Resend registration email verification code
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponseDto> resendVerification(@Valid @RequestBody ForgotPasswordRequestDto request) {
        ApiResponseDto response = authService.resendEmailVerification(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/select-role
     * Select user role after email verification (for Google OAuth users)
     */
    @PostMapping("/select-role")
    public ResponseEntity<AuthResponseDto> selectRole(@Valid @RequestBody Map<String, String> request, Authentication authentication) {
        String email = authentication.getName();
        String role = request.get("role");
        
        if (role == null || (!role.equals("HOMEOWNER") && !role.equals("TECHNICIAN"))) {
            throw new RuntimeException("Invalid role. Must be HOMEOWNER or TECHNICIAN");
        }
        
        AuthResponseDto response = authService.updateUserRole(email, role);
        return ResponseEntity.ok(response);
    }
}
