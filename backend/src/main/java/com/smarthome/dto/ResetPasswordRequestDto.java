package com.smarthome.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ResetPasswordRequestDto {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Code is required")
    @Size(min = 6, max = 6, message = "Code must be exactly 6 digits")
    private String code;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 50, message = "Password must be 6-50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Password must contain only letters and numbers")
    private String newPassword;
}
