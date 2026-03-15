package com.smarthome.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeviceScheduleResponseDto {
    private Long id;
    private Long deviceId;
    private String deviceName;
    private String action;
    private String time;
    private String daysOfWeek;
    private boolean enabled;
    private LocalDateTime nextRunAt;
}
