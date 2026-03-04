package com.smarthome.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceUpdateRequestDto {
    @Size(max = 100, message = "Device name must be at most 100 characters")
    private String name;

    @Size(max = 50, message = "Device type must be at most 50 characters")
    private String type;

    @DecimalMin(value = "0.01", inclusive = true, message = "Power rating must be greater than 0")
    private Double powerRating;

    @Size(max = 50, message = "Room must be at most 50 characters")
    private String room;

    @Pattern(regexp = "ON|OFF|STANDBY", message = "Status must be ON, OFF, or STANDBY")
    private String status;
}
