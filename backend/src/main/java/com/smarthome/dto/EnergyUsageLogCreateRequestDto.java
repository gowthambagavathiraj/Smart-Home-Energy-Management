package com.smarthome.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyUsageLogCreateRequestDto {

    private LocalDateTime timestamp;

    @NotNull(message = "Energy used is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Energy used must be greater than 0")
    private Double energyUsed;

    @DecimalMin(value = "0.0", inclusive = true, message = "Cost cannot be negative")
    private Double cost;

    @Min(value = 1, message = "Duration minutes must be at least 1")
    private Integer durationMinutes;
}
