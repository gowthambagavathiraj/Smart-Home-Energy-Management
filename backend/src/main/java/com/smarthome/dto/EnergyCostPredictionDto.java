package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyCostPredictionDto {
    private Double ratePerKwh;
    private Double averageDailyKwh;
    private Double estimatedDailyCost;
    private Double estimatedMonthlyCost;
}
