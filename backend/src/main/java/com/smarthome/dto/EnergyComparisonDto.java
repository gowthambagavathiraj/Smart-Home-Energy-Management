package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyComparisonDto {
    private String currentLabel;
    private String previousLabel;
    private Double currentEnergy;
    private Double previousEnergy;
    private Double deltaEnergy;
    private Double deltaPercent;
    private String trend;
}
