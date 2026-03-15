package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianMaintenanceRequestDto {
    private Long notificationId;
    private String title;
    private String message;
    private String type;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long deviceId;
    private String deviceName;
    private String createdAt;
    private Boolean read;
    private String priority;
}
