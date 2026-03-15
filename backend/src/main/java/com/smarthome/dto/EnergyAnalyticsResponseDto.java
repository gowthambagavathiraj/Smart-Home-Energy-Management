package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyAnalyticsResponseDto {
    private List<EnergyConsumptionPointDto> dailyPoints;
    private List<EnergyConsumptionPointDto> weeklyPoints;
    private List<EnergyConsumptionPointDto> monthlyPoints;
    private Double totalEnergyLast7Days;
    private Double totalCostLast7Days;
    private EnergyComparisonDto comparison;
    private EnergyCostPredictionDto costPrediction;
    private PeakOffPeakDto peakOffPeak;
}
