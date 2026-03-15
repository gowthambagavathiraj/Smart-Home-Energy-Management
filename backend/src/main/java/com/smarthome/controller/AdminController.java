package com.smarthome.controller;

import com.smarthome.dto.AdminDashboardStatsDto;
import com.smarthome.dto.AdminUserUpdateRequestDto;
import com.smarthome.dto.DeviceResponseDto;
import com.smarthome.dto.EnergyAnalyticsResponseDto;
import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.EnergyUsageLogResponseDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
import com.smarthome.dto.NotificationDto;
import com.smarthome.dto.RecommendationDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDto> getUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUser(email, id));
    }

    @GetMapping("/users/{id}/devices")
    public ResponseEntity<List<DeviceResponseDto>> getUserDevices(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserDevices(email, id));
    }

    @GetMapping("/users/{id}/devices/{deviceId}/energy-logs")
    public ResponseEntity<List<EnergyUsageLogResponseDto>> getUserDeviceLogs(
            @PathVariable Long id,
            @PathVariable Long deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserDeviceEnergyLogs(email, id, deviceId, start, end));
    }

    @GetMapping("/users/{id}/energy/realtime")
    public ResponseEntity<RealtimeUsageResponseDto> getUserRealtimeUsage(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserRealtimeUsage(email, id));
    }

    @GetMapping("/users/{id}/energy/consumption")
    public ResponseEntity<EnergyConsumptionResponseDto> getUserConsumption(
            @PathVariable Long id,
            @RequestParam(defaultValue = "hourly") String period,
            @RequestParam(defaultValue = "12") int points,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserConsumption(email, id, period, points));
    }

    @GetMapping("/users/{id}/energy/analytics")
    public ResponseEntity<EnergyAnalyticsResponseDto> getUserAnalytics(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserAnalytics(email, id));
    }

    @GetMapping("/users/{id}/notifications")
    public ResponseEntity<List<NotificationDto>> getUserNotifications(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserNotifications(email, id));
    }

    @GetMapping("/users/{id}/recommendations")
    public ResponseEntity<List<RecommendationDto>> getUserRecommendations(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(adminService.getUserRecommendations(email, id));
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
