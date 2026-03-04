package com.smarthome.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponseDto {

    private Long id;
    private String name;
    private String type;
    private Double powerRating;
    private String status;
    private String room;

    // 🔥 ADD THESE
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}