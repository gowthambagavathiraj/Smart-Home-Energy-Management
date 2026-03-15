package com.smarthome.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RecommendationDto {
    private String title;
    private String message;
    private String category;
    private Double savingsPercent;
}
