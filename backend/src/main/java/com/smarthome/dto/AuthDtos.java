package com.smarthome.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

// ==================== REQUEST DTOs ====================

class RegisterRequest {
    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50)
    public String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50)
    public String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    public String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 50, message = "Password must be 6-50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Password must contain only letters and numbers")
    public String password;
}

class LoginRequest {
    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Password must contain only letters and numbers")
    public String password;
}

class ForgotPasswordRequest {
    @NotBlank
    @Email
    public String email;
}

class VerifyResetCodeRequest {
    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Size(min = 6, max = 6, message = "Code must be 6 digits")
    public String code;
}

class ResetPasswordRequest {
    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Size(min = 6, max = 6)
    public String code;

    @NotBlank
    @Size(min = 6, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Password must contain only letters and numbers")
    public String newPassword;
}

// ==================== RESPONSE DTOs ====================

class AuthResponse {
    public String token;
    public UserDto user;
    public String message;

    public AuthResponse(String token, UserDto user, String message) {
        this.token = token;
        this.user = user;
        this.message = message;
    }
}

class UserDto {
    public Long id;
    public String firstName;
    public String lastName;
    public String email;
    public String provider;
}

class ApiResponse {
    public boolean success;
    public String message;

    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}

class ErrorResponse {
    public String message;
    public int status;

    public ErrorResponse(String message, int status) {
        this.message = message;
        this.status = status;
    }
}
