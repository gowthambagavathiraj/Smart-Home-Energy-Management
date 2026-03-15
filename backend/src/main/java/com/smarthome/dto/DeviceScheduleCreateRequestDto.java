package com.smarthome.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeviceScheduleCreateRequestDto {
    @NotNull
    private Long deviceId;

    @NotBlank
    private String action; // ON/OFF

    @NotBlank
    private String time; // HH:mm

    private String daysOfWeek; // MON,TUE,... optional

    private Boolean enabled;
}
