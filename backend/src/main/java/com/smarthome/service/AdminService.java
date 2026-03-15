package com.smarthome.service;

import com.smarthome.dto.AdminDashboardStatsDto;
import com.smarthome.dto.AdminUserUpdateRequestDto;
import com.smarthome.dto.DeviceResponseDto;
import com.smarthome.dto.EnergyAnalyticsResponseDto;
import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.EnergyUsageLogResponseDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
import com.smarthome.dto.NotificationDto;
import com.smarthome.dto.RecommendationDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.model.User;
import com.smarthome.repository.UserRepository;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.DeviceScheduleRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceScheduleRepository deviceScheduleRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;
    private final DeviceService deviceService;
    private final EnergyTrackingService energyTrackingService;
    private final NotificationService notificationService;
    private final RecommendationService recommendationService;

    public AdminDashboardStatsDto getDashboardStats(String adminEmail) {
        requireAdmin(adminEmail);

        List<User> users = userRepository.findAll();
        long totalUsers = users.size();
        long activeUsers = users.stream().filter(User::isActive).count();
        long loggedInUsers = users.stream().filter(u -> (u.getLoginCount() != null && u.getLoginCount() > 0)).count();
        long adminCount = users.stream().filter(u -> u.getRole() == User.Role.ADMIN).count();
        long homeownerCount = users.stream().filter(u -> u.getRole() == User.Role.HOMEOWNER).count();
        long technicianCount = users.stream().filter(u -> u.getRole() == User.Role.TECHNICIAN).count();
        long totalDevices = deviceRepository.count();
        long activeDevices = deviceRepository.findByStatus("ON").size();
        long installations = deviceScheduleRepository.count();
        double totalEnergyUsage = energyUsageLogRepository.sumTotalEnergyUsed();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        double monthlyEnergyUsage = energyUsageLogRepository.sumEnergyUsedBetween(monthStart, now);
        double co2Reduction = monthlyEnergyUsage * 0.82;

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .loggedInUsers(loggedInUsers)
                .totalDevices(totalDevices)
                .activeDevices(activeDevices)
                .installations(installations)
                .totalEnergyUsage(Math.round(totalEnergyUsage * 100.0) / 100.0)
                .monthlyEnergyUsage(Math.round(monthlyEnergyUsage * 100.0) / 100.0)
                .co2Reduction(Math.round(co2Reduction * 100.0) / 100.0)
                .adminCount(adminCount)
                .homeownerCount(homeownerCount)
                .technicianCount(technicianCount)
                .build();
    }

    public List<UserResponseDto> getAllUsers(String adminEmail) {
        requireAdmin(adminEmail);

        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UserResponseDto getUser(String adminEmail, Long userId) {
        requireAdmin(adminEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    public List<DeviceResponseDto> getUserDevices(String adminEmail, Long userId) {
        requireAdmin(adminEmail);
        ensureUserExists(userId);
        return deviceService.getUserDevicesById(userId);
    }

    public List<EnergyUsageLogResponseDto> getUserDeviceEnergyLogs(
            String adminEmail,
            Long userId,
            Long deviceId,
            LocalDateTime start,
            LocalDateTime end
    ) {
        requireAdmin(adminEmail);
        ensureUserExists(userId);
        return deviceService.getDeviceEnergyLogsByUserId(userId, deviceId, start, end);
    }

    public RealtimeUsageResponseDto getUserRealtimeUsage(String adminEmail, Long userId) {
        User admin = requireAdmin(adminEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return energyTrackingService.getRealtimeUsageForUser(target);
    }

    public EnergyConsumptionResponseDto getUserConsumption(String adminEmail, Long userId, String period, int points) {
        requireAdmin(adminEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return energyTrackingService.getConsumptionForUser(target, period, points);
    }

    public EnergyAnalyticsResponseDto getUserAnalytics(String adminEmail, Long userId) {
        requireAdmin(adminEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return energyTrackingService.getAnalyticsForUser(target);
    }

    public List<NotificationDto> getUserNotifications(String adminEmail, Long userId) {
        requireAdmin(adminEmail);
        ensureUserExists(userId);
        return notificationService.getUserNotifications(userId);
    }

    public List<RecommendationDto> getUserRecommendations(String adminEmail, Long userId) {
        requireAdmin(adminEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return recommendationService.getRecommendationsForUser(target);
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

    private void ensureUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
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
