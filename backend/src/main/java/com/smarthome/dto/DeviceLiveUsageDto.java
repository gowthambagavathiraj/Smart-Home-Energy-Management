package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceLiveUsageDto {
    private Long deviceId;
    private String deviceName;
    private String type;
    private String status;
    private Double powerKw;
}
