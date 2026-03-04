package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyConsumptionPointDto {
    private String label;
    private LocalDateTime start;
    private LocalDateTime end;
    private Double energyUsed;
    private Double cost;
}
