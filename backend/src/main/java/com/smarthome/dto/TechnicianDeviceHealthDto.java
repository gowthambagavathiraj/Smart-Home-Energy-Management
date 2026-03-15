package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianDeviceHealthDto {
    private Long deviceId;
    private String deviceName;
    private String deviceType;
    private String room;
    private String status;
    private Long userId;
    private String userName;
    private String userEmail;
    private Double voltage;
    private Double current;
    private Double power;
    private String healthStatus;
    private String lastSeen;
}
