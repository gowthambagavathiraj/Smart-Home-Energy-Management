package com.smarthome.service;

import com.smarthome.dto.AdminDashboardStatsDto;
import com.smarthome.dto.AdminUserUpdateRequestDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.model.User;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    public AdminDashboardStatsDto getDashboardStats(String adminEmail) {
        requireAdmin(adminEmail);

        List<User> users = userRepository.findAll();
        long totalUsers = users.size();
        long activeUsers = users.stream().filter(User::isActive).count();
        long loggedInUsers = users.stream().filter(u -> (u.getLoginCount() != null && u.getLoginCount() > 0)).count();

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .loggedInUsers(loggedInUsers)
                .build();
    }

    public List<UserResponseDto> getAllUsers(String adminEmail) {
        requireAdmin(adminEmail);

        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponseDto updateUser(String adminEmail, Long userId, AdminUserUpdateRequestDto request) {
        User admin = requireAdmin(adminEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getId().equals(admin.getId()) && !request.getActive()) {
            throw new RuntimeException("Admin cannot deactivate their own account");
        }

        if (user.getId().equals(admin.getId()) && request.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Admin cannot remove their own ADMIN role");
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setRole(request.getRole());
        user.setActive(request.getActive());
        User savedUser = userRepository.save(user);

        return mapToDto(savedUser);
    }

    @Transactional
    public void deleteUser(String adminEmail, Long userId) {
        User admin = requireAdmin(adminEmail);
        if (admin.getId().equals(userId)) {
            throw new RuntimeException("Admin cannot delete their own account");
        }

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        userRepository.deleteById(userId);
    }

    private User requireAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Access denied: admin only");
        }
        return user;
    }

    private UserResponseDto mapToDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .provider(user.getProvider().name())
                .role(user.getRole().name())
                .active(user.isActive())
                .loginCount(user.getLoginCount() == null ? 0L : user.getLoginCount())
                .build();
    }
}
