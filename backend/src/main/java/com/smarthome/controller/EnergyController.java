package com.smarthome.controller;

import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
import com.smarthome.service.EnergyTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/energy")
@RequiredArgsConstructor
public class EnergyController {

    private final EnergyTrackingService energyTrackingService;

    /**
     * GET /api/energy/realtime
     * Returns current total household usage based on dummy IoT readings.
     */
    @GetMapping("/realtime")
    public ResponseEntity<RealtimeUsageResponseDto> getRealtimeUsage(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(energyTrackingService.getRealtimeUsage(email));
    }

    /**
     * GET /api/energy/consumption?period=hourly&points=12
     * period: hourly|daily
     */
    @GetMapping("/consumption")
    public ResponseEntity<EnergyConsumptionResponseDto> getConsumption(
            @RequestParam(defaultValue = "hourly") String period,
            @RequestParam(defaultValue = "12") int points,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(energyTrackingService.getConsumption(email, period, points));
    }
}
