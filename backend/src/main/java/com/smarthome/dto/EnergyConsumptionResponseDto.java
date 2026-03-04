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
public class EnergyConsumptionResponseDto {
    private String period;
    private LocalDateTime from;
    private LocalDateTime to;
    private Double totalEnergy;
    private Double totalCost;
    private List<EnergyConsumptionPointDto> points;
}
