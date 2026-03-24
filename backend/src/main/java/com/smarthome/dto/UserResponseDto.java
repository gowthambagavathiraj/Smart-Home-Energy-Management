package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String provider;
    private String role;
    private boolean active;
    private boolean assignedByTechnician;
    private boolean emailVerified;
    private Long loginCount;
    private java.time.LocalDateTime createdAt;
}
