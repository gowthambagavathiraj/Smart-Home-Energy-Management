package com.smarthome.controller;

import com.smarthome.dto.AdminDashboardStatsDto;
import com.smarthome.dto.DeviceResponseDto;
import com.smarthome.dto.EnergyAnalyticsResponseDto;
import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.EnergyUsageLogResponseDto;
import com.smarthome.dto.NotificationDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
import com.smarthome.dto.RecommendationDto;
import com.smarthome.dto.TechnicianDeviceHealthDto;
import com.smarthome.dto.TechnicianInstallationRequestDto;
import com.smarthome.dto.TechnicianMaintenanceRequestDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.service.TechnicianService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/technician")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getDashboardStats(email));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getAllUsers(email));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDto> getUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUser(email, id));
    }

    @GetMapping("/users/{id}/devices")
    public ResponseEntity<List<DeviceResponseDto>> getUserDevices(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUserDevices(email, id));
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
        return ResponseEntity.ok(technicianService.getUserDeviceEnergyLogs(email, id, deviceId, start, end));
    }

    @GetMapping("/users/{id}/energy/realtime")
    public ResponseEntity<RealtimeUsageResponseDto> getUserRealtimeUsage(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUserRealtimeUsage(email, id));
    }

    @GetMapping("/users/{id}/energy/consumption")
    public ResponseEntity<EnergyConsumptionResponseDto> getUserConsumption(
            @PathVariable Long id,
            @RequestParam(defaultValue = "hourly") String period,
            @RequestParam(defaultValue = "12") int points,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUserConsumption(email, id, period, points));
    }

    @GetMapping("/users/{id}/energy/analytics")
    public ResponseEntity<EnergyAnalyticsResponseDto> getUserAnalytics(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUserAnalytics(email, id));
    }

    @GetMapping("/users/{id}/notifications")
    public ResponseEntity<List<NotificationDto>> getUserNotifications(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUserNotifications(email, id));
    }

    @GetMapping("/users/{id}/recommendations")
    public ResponseEntity<List<RecommendationDto>> getUserRecommendations(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getUserRecommendations(email, id));
    }

    @GetMapping("/devices/health")
    public ResponseEntity<List<TechnicianDeviceHealthDto>> getAllDevicesHealth(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getAllDevicesHealth(email));
    }

    @GetMapping("/maintenance-requests")
    public ResponseEntity<List<TechnicianMaintenanceRequestDto>> getMaintenanceRequests(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getMaintenanceRequests(email));
    }

    @GetMapping("/devices/offline")
    public ResponseEntity<List<DeviceResponseDto>> getOfflineDevices(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getOfflineDevices(email));
    }

    @GetMapping("/installation-requests")
    public ResponseEntity<List<TechnicianInstallationRequestDto>> getInstallationRequests(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.getInstallationRequests(email));
    }

    @PostMapping("/users/{userId}/assign")
    public ResponseEntity<UserResponseDto> assignUser(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(technicianService.assignUser(email, userId));
    }
}
