package com.smarthome.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceCreateRequestDto {
    @NotBlank(message = "Device name is required")
    @Size(max = 100, message = "Device name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Device type is required")
    @Size(max = 50, message = "Device type must be at most 50 characters")
    private String type;

    @NotNull(message = "Power rating is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Power rating must be greater than 0")
    private Double powerRating;

    @Size(max = 50, message = "Room must be at most 50 characters")
    private String room;
}
