package com.smarthome.controller;

import com.smarthome.dto.*;
import com.smarthome.service.DeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    /**
     * POST /api/devices
     * Create a new device
     */
    @PostMapping
    public ResponseEntity<DeviceResponseDto> createDevice(
            @Valid @RequestBody DeviceCreateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        DeviceResponseDto device = deviceService.createDevice(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(device);
    }

    /**
     * GET /api/devices
     * Get all devices for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<DeviceResponseDto>> getUserDevices(Authentication authentication) {
        String email = authentication.getName();
        List<DeviceResponseDto> devices = deviceService.getUserDevices(email);
        return ResponseEntity.ok(devices);
    }

    /**
     * GET /api/devices/{id}
     * Get a specific device by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<DeviceResponseDto> getDevice(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        DeviceResponseDto device = deviceService.getDevice(email, id);
        return ResponseEntity.ok(device);
    }

    /**
     * PUT /api/devices/{id}
     * Update a device
     */
    @PutMapping("/{id}")
    public ResponseEntity<DeviceResponseDto> updateDevice(
            @PathVariable Long id,
            @Valid @RequestBody DeviceUpdateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        DeviceResponseDto device = deviceService.updateDevice(email, id, request);
        return ResponseEntity.ok(device);
    }

    /**
     * DELETE /api/devices/{id}
     * Delete a device
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDto> deleteDevice(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        deviceService.deleteDevice(email, id);
        return ResponseEntity.ok(new ApiResponseDto(true, "Device deleted successfully"));
    }

    /**
     * POST /api/devices/{id}/toggle
     * Toggle device ON/OFF status
     */
    @PostMapping("/{id}/toggle")
    public ResponseEntity<DeviceResponseDto> toggleDevice(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        DeviceResponseDto device = deviceService.toggleDeviceStatus(email, id);
        return ResponseEntity.ok(device);
    }

    /**
     * GET /api/devices/{id}/energy-logs
     * Get energy usage logs for a device
     * Optional query params: start, end (ISO date-time format)
     */
    @GetMapping("/{id}/energy-logs")
    public ResponseEntity<List<EnergyUsageLogResponseDto>> getDeviceEnergyLogs(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            Authentication authentication
    ) {
        String email = authentication.getName();
        List<EnergyUsageLogResponseDto> logs = deviceService.getDeviceEnergyLogs(email, id, start, end);
        return ResponseEntity.ok(logs);
    }

    /**
     * POST /api/devices/{id}/energy-logs
     * Create an energy usage log entry for the device
     */
    @PostMapping("/{id}/energy-logs")
    public ResponseEntity<EnergyUsageLogResponseDto> createDeviceEnergyLog(
            @PathVariable Long id,
            @Valid @RequestBody EnergyUsageLogCreateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        EnergyUsageLogResponseDto createdLog = deviceService.createDeviceEnergyLog(email, id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLog);
    }
}
