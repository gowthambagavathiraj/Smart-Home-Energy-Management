package com.smarthome.controller;

import com.smarthome.dto.ApiResponseDto;
import com.smarthome.dto.UserProfileUpdateRequestDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.service.AuthService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    /**
     * GET /api/user/profile
     * Get current authenticated user's profile
     */
    @GetMapping("/profile")
    public ResponseEntity<UserResponseDto> getProfile(Authentication authentication) {
        String email = authentication.getName();
        UserResponseDto user = authService.getCurrentUser(email);
        return ResponseEntity.ok(user);
    }

    /**
     * PUT /api/user/profile
     * Update current user's profile (name only)
     */
    @PutMapping("/profile")
    public ResponseEntity<UserResponseDto> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(authService.updateProfile(email, request));
    }

    /**
     * DELETE /api/user
     * Delete current authenticated user's account
     */
    @DeleteMapping
    public ResponseEntity<ApiResponseDto> deleteAccount(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(authService.deleteAccount(email));
    }
}
