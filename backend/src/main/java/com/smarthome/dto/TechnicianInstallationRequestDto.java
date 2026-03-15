package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianInstallationRequestDto {
    private Long userId;
    private String userName;
    private String userEmail;
    private String address;
    private Integer deviceCount;
    private String requestedDeviceType;
    private String status;
    private String requestDate;
}
