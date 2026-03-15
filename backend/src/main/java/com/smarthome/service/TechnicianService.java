package com.smarthome.service;

import com.smarthome.dto.AdminDashboardStatsDto;
import com.smarthome.dto.DeviceResponseDto;
import com.smarthome.dto.EnergyAnalyticsResponseDto;
import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.EnergyUsageLogResponseDto;
import com.smarthome.dto.NotificationDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
import com.smarthome.dto.RecommendationDto;
import com.smarthome.dto.TechnicianDeviceHealthDto;
import com.smarthome.dto.TechnicianInstallationRequestDto;
import com.smarthome.dto.TechnicianMaintenanceRequestDto;
import com.smarthome.dto.UserResponseDto;
import com.smarthome.model.Device;
import com.smarthome.model.Notification;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.DeviceScheduleRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import com.smarthome.repository.NotificationRepository;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceScheduleRepository deviceScheduleRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;
    private final NotificationRepository notificationRepository;
    private final DeviceService deviceService;
    private final EnergyTrackingService energyTrackingService;
    private final NotificationService notificationService;
    private final RecommendationService recommendationService;

    public AdminDashboardStatsDto getDashboardStats(String email) {
        requireTechnician(email);
        List<User> users = userRepository.findAll();
        long totalUsers = users.size();
        long activeUsers = users.stream().filter(User::isActive).count();
        long loggedInUsers = users.stream().filter(u -> (u.getLoginCount() != null && u.getLoginCount() > 0)).count();
        long adminCount = users.stream().filter(u -> u.getRole() == User.Role.ADMIN).count();
        long homeownerCount = users.stream().filter(u -> u.getRole() == User.Role.HOMEOWNER).count();
        long technicianCount = users.stream().filter(u -> u.getRole() == User.Role.TECHNICIAN).count();
        long totalDevices = deviceRepository.count();
        long installations = deviceScheduleRepository.count();
        double totalEnergyUsage = energyUsageLogRepository.sumTotalEnergyUsed();

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .loggedInUsers(loggedInUsers)
                .totalDevices(totalDevices)
                .installations(installations)
                .totalEnergyUsage(Math.round(totalEnergyUsage * 100.0) / 100.0)
                .adminCount(adminCount)
                .homeownerCount(homeownerCount)
                .technicianCount(technicianCount)
                .build();
    }

    public List<UserResponseDto> getAllUsers(String email) {
        requireTechnician(email);
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
    }

    public UserResponseDto getUser(String email, Long userId) {
        requireTechnician(email);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    public List<DeviceResponseDto> getUserDevices(String email, Long userId) {
        requireTechnician(email);
        ensureUserExists(userId);
        return deviceService.getUserDevicesById(userId);
    }

    public List<EnergyUsageLogResponseDto> getUserDeviceEnergyLogs(
            String email,
            Long userId,
            Long deviceId,
            LocalDateTime start,
            LocalDateTime end
    ) {
        requireTechnician(email);
        ensureUserExists(userId);
        return deviceService.getDeviceEnergyLogsByUserId(userId, deviceId, start, end);
    }

    public RealtimeUsageResponseDto getUserRealtimeUsage(String email, Long userId) {
        requireTechnician(email);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return energyTrackingService.getRealtimeUsageForUser(target);
    }

    public EnergyConsumptionResponseDto getUserConsumption(String email, Long userId, String period, int points) {
        requireTechnician(email);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return energyTrackingService.getConsumptionForUser(target, period, points);
    }

    public EnergyAnalyticsResponseDto getUserAnalytics(String email, Long userId) {
        requireTechnician(email);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return energyTrackingService.getAnalyticsForUser(target);
    }

    public List<NotificationDto> getUserNotifications(String email, Long userId) {
        requireTechnician(email);
        ensureUserExists(userId);
        return notificationService.getUserNotifications(userId);
    }

    public List<RecommendationDto> getUserRecommendations(String email, Long userId) {
        requireTechnician(email);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return recommendationService.getRecommendationsForUser(target);
    }

    public List<TechnicianDeviceHealthDto> getAllDevicesHealth(String email) {
        requireTechnician(email);
        List<Device> allDevices = deviceRepository.findAll();
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        
        return allDevices.stream()
                .map(device -> {
                    User owner = userMap.get(device.getUserId());
                    String healthStatus = determineHealthStatus(device);
                    return TechnicianDeviceHealthDto.builder()
                            .deviceId(device.getId())
                            .deviceName(device.getName())
                            .deviceType(device.getType())
                            .room(device.getRoom())
                            .status(device.getStatus())
                            .userId(device.getUserId())
                            .userName(owner != null ? owner.getFirstName() + " " + owner.getLastName() : "Unknown")
                            .userEmail(owner != null ? owner.getEmail() : "")
                            .voltage(230.0)
                            .current(device.getStatus().equals("ON") ? device.getPowerRating() / 0.23 : 0.0)
                            .power(device.getStatus().equals("ON") ? device.getPowerRating() : 0.0)
                            .healthStatus(healthStatus)
                            .lastSeen(device.getUpdatedAt() != null ? device.getUpdatedAt().toString() : LocalDateTime.now().toString())
                            .build();
                })
                .toList();
    }

    public List<TechnicianMaintenanceRequestDto> getMaintenanceRequests(String email) {
        requireTechnician(email);
        List<Notification> notifications = notificationRepository.findAll();
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        
        return notifications.stream()
                .filter(n -> n.getType() == Notification.Type.ALERT)
                .map(notification -> {
                    User owner = userMap.get(notification.getUserId());
                    String priority = determinePriority(notification);
                    
                    return TechnicianMaintenanceRequestDto.builder()
                            .notificationId(notification.getId())
                            .title(notification.getTitle())
                            .message(notification.getMessage())
                            .type(notification.getType().name())
                            .userId(notification.getUserId())
                            .userName(owner != null ? owner.getFirstName() + " " + owner.getLastName() : "Unknown")
                            .userEmail(owner != null ? owner.getEmail() : "")
                            .deviceId(null)
                            .deviceName("N/A")
                            .createdAt(notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : "")
                            .read(notification.isRead())
                            .priority(priority)
                            .build();
                })
                .toList();
    }

    public List<DeviceResponseDto> getOfflineDevices(String email) {
        requireTechnician(email);
        List<Device> allDevices = deviceRepository.findAll();
        return allDevices.stream()
                .filter(device -> !device.getStatus().equals("ON"))
                .map(this::mapToDeviceDto)
                .toList();
    }

    public List<TechnicianInstallationRequestDto> getInstallationRequests(String email) {
        requireTechnician(email);
        List<User> homeowners = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.HOMEOWNER)
                .toList();
        
        Map<Long, Long> userDeviceCount = deviceRepository.findAll().stream()
                .collect(Collectors.groupingBy(Device::getUserId, Collectors.counting()));
        
        return homeowners.stream()
                .filter(user -> !userDeviceCount.containsKey(user.getId()) || userDeviceCount.get(user.getId()) == 0)
                .map(user -> TechnicianInstallationRequestDto.builder()
                        .userId(user.getId())
                        .userName(user.getFirstName() + " " + user.getLastName())
                        .userEmail(user.getEmail())
                        .address(user.getFirstName() + "'s Home")
                        .deviceCount(0)
                        .requestedDeviceType("Smart Plug")
                        .status("Pending")
                        .requestDate(user.getCreatedAt() != null ? user.getCreatedAt().toString() : LocalDateTime.now().toString())
                        .build())
                .toList();
    }

    private String determineHealthStatus(Device device) {
        if (device.getStatus().equals("ON")) {
            return "Healthy";
        } else {
            LocalDateTime lastUpdate = device.getUpdatedAt();
            if (lastUpdate != null && lastUpdate.isBefore(LocalDateTime.now().minusHours(24))) {
                return "Critical";
            }
            return "Warning";
        }
    }

    private String determinePriority(Notification notification) {
        String message = notification.getMessage().toLowerCase();
        String title = notification.getTitle().toLowerCase();
        
        if (message.contains("critical") || message.contains("urgent") || title.contains("critical")) {
            return "High";
        } else if (message.contains("warning") || message.contains("attention")) {
            return "Medium";
        }
        return "Low";
    }

    private User requireTechnician(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.TECHNICIAN) {
            throw new RuntimeException("Access denied: technician only");
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

    private DeviceResponseDto mapToDeviceDto(Device device) {
        return DeviceResponseDto.builder()
                .id(device.getId())
                .name(device.getName())
                .type(device.getType())
                .room(device.getRoom())
                .status(device.getStatus())
                .powerRating(device.getPowerRating())
                .userId(device.getUserId())
                .createdAt(device.getCreatedAt())
                .updatedAt(device.getUpdatedAt())
                .build();
    }
}
