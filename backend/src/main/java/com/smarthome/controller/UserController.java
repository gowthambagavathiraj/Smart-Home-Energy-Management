package com.smarthome.controller;

import com.smarthome.dto.UserResponseDto;
import com.smarthome.service.AuthService;
import lombok.RequiredArgsConstructor;
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
}
