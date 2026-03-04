package com.smarthome.controller;

import com.smarthome.dto.AdminDashboardStatsDto;
import com.smarthome.dto.AdminUserUpdateRequestDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getDashboardStats(email));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getAllUsers(email));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponseDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserUpdateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.updateUser(email, id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        adminService.deleteUser(email, id);
        return ResponseEntity.noContent().build();
    }
}
