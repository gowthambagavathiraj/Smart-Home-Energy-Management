package com.smarthome.controller;

import com.smarthome.dto.DeviceScheduleCreateRequestDto;
import com.smarthome.dto.DeviceScheduleResponseDto;
import com.smarthome.dto.DeviceScheduleUpdateRequestDto;
import com.smarthome.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<List<DeviceScheduleResponseDto>> getSchedules(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleService.getSchedules(email));
    }

    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<DeviceScheduleResponseDto>> getSchedulesByDevice(
            @PathVariable Long deviceId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleService.getSchedulesByDevice(email, deviceId));
    }

    @PostMapping
    public ResponseEntity<DeviceScheduleResponseDto> createSchedule(
            @Valid @RequestBody DeviceScheduleCreateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.createSchedule(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeviceScheduleResponseDto> updateSchedule(
            @PathVariable Long id,
            @RequestBody DeviceScheduleUpdateRequestDto request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleService.updateSchedule(email, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        scheduleService.deleteSchedule(email, id);
        return ResponseEntity.noContent().build();
    }
}
