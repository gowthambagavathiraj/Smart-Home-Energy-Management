package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeUsageResponseDto {
    private LocalDateTime timestamp;
    private Double totalPowerKw;
    private Integer activeDevices;
    private Integer totalDevices;
    private List<DeviceLiveUsageDto> devices;
}
