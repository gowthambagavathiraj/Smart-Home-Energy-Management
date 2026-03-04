package com.smarthome.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyUsageLogResponseDto {

    private Long id;
    private Long deviceId;

    // 🔥 ADD THIS (THIS IS YOUR ERROR)
    private LocalDateTime timestamp;

    private Double energyUsed;
    private Double cost;
    private Integer durationMinutes;
}