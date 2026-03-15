package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeakOffPeakDto {
    private String peakHour;
    private String offPeakHour;
    private Double peakEnergy;
    private Double offPeakEnergy;
}
