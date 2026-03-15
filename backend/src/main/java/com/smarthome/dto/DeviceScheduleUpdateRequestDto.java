package com.smarthome.dto;

import lombok.Data;

@Data
public class DeviceScheduleUpdateRequestDto {
    private String action; // ON/OFF
    private String time; // HH:mm
    private String daysOfWeek;
    private Boolean enabled;
}
