package com.smarthome.service;

import com.smarthome.dto.*;
import com.smarthome.model.Device;
import com.smarthome.model.EnergyUsageLog;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final EnergyUsageLogRepository energyLogRepository;
    private final UserRepository userRepository;

    private static final double COST_PER_KWH = 6.0; // ₹ per kWh (configurable)

    // ========== CREATE DEVICE ==========
    @Transactional
    public DeviceResponseDto createDevice(String email, DeviceCreateRequestDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureNotTechnician(user);

        Device device = Device.builder()
                .name(request.getName())
                .type(request.getType())
                .powerRating(request.getPowerRating())
                .room(request.getRoom())
                .status("OFF")
                .userId(user.getId())
                .build();

        Device savedDevice = deviceRepository.save(device);
        log.info("Device created: {} for user: {}", savedDevice.getName(), email);

        return mapToDeviceDto(savedDevice);
    }

    // ========== GET ALL USER'S DEVICES ==========
    public List<DeviceResponseDto> getUserDevices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Device> devices = deviceRepository.findByUserId(user.getId());
        return devices.stream()
                .map(this::mapToDeviceDto)
                .collect(Collectors.toList());
    }

    // ========== ADMIN: GET DEVICES BY USER ID ==========
    public List<DeviceResponseDto> getUserDevicesById(Long userId) {
        List<Device> devices = deviceRepository.findByUserId(userId);
        return devices.stream()
                .map(this::mapToDeviceDto)
                .collect(Collectors.toList());
    }

    // ========== GET SINGLE DEVICE ==========
    public DeviceResponseDto getDevice(String email, Long deviceId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));

        return mapToDeviceDto(device);
    }

    // ========== UPDATE DEVICE ==========
    @Transactional
    public DeviceResponseDto updateDevice(String email, Long deviceId, DeviceUpdateRequestDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureNotTechnician(user);

        Device device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));

        // Update only provided fields
        if (request.getName() != null) device.setName(request.getName());
        if (request.getType() != null) device.setType(request.getType());
        if (request.getPowerRating() != null) device.setPowerRating(request.getPowerRating());
        if (request.getRoom() != null) device.setRoom(request.getRoom());

        // Status change triggers energy log
        if (request.getStatus() != null && !request.getStatus().equals(device.getStatus())) {
            String oldStatus = device.getStatus();
            device.setStatus(request.getStatus());

            // If turning OFF, log energy usage for this session
            if ("OFF".equals(request.getStatus()) && "ON".equals(oldStatus)) {
                logEnergyUsage(device);
            }
        }

        Device updatedDevice = deviceRepository.save(device);
        log.info("Device updated: {} for user: {}", updatedDevice.getName(), email);

        return mapToDeviceDto(updatedDevice);
    }

    // ========== DELETE DEVICE ==========
    @Transactional
    public void deleteDevice(String email, Long deviceId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureNotTechnician(user);

        if (!deviceRepository.existsByIdAndUserId(deviceId, user.getId())) {
            throw new RuntimeException("Device not found or access denied");
        }

        deviceRepository.deleteById(deviceId);
        log.info("Device deleted: {} for user: {}", deviceId, email);
    }

    // ========== TOGGLE DEVICE STATUS ==========
    @Transactional
    public DeviceResponseDto toggleDeviceStatus(String email, Long deviceId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureNotTechnician(user);

        Device device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));

        String newStatus = "ON".equals(device.getStatus()) ? "OFF" : "ON";
        device.setStatus(newStatus);

        // Log energy usage when turning OFF
        if ("OFF".equals(newStatus)) {
            logEnergyUsage(device);
        }

        Device updatedDevice = deviceRepository.save(device);
        log.info("Device {} toggled to: {}", device.getName(), newStatus);

        return mapToDeviceDto(updatedDevice);
    }

    // ========== GET DEVICE ENERGY LOGS ==========
    public List<EnergyUsageLogResponseDto> getDeviceEnergyLogs(String email, Long deviceId, LocalDateTime start, LocalDateTime end) {
        Device device = findOwnedDevice(email, deviceId);

        List<EnergyUsageLog> logs;
        if (start != null && end != null) {
            logs = energyLogRepository.findByDeviceIdAndTimestampBetweenOrderByTimestampDesc(device.getId(), start, end);
        } else {
            logs = energyLogRepository.findByDeviceIdOrderByTimestampDesc(device.getId());
        }

        return logs.stream()
                .map(this::mapToEnergyLogDto)
                .collect(Collectors.toList());
    }

    // ========== ADMIN: GET DEVICE ENERGY LOGS ==========
    public List<EnergyUsageLogResponseDto> getDeviceEnergyLogsByUserId(Long userId, Long deviceId, LocalDateTime start, LocalDateTime end) {
        Device device = findUserDevice(userId, deviceId);

        List<EnergyUsageLog> logs;
        if (start != null && end != null) {
            logs = energyLogRepository.findByDeviceIdAndTimestampBetweenOrderByTimestampDesc(device.getId(), start, end);
        } else {
            logs = energyLogRepository.findByDeviceIdOrderByTimestampDesc(device.getId());
        }

        return logs.stream()
                .map(this::mapToEnergyLogDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EnergyUsageLogResponseDto createDeviceEnergyLog(String email, Long deviceId, EnergyUsageLogCreateRequestDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureNotTechnician(user);
        Device device = findOwnedDevice(email, deviceId);

        Double cost = request.getCost();
        if (cost == null) {
            cost = request.getEnergyUsed() * COST_PER_KWH;
        }

        EnergyUsageLog logEntry = EnergyUsageLog.builder()
                .deviceId(device.getId())
                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now())
                .energyUsed(request.getEnergyUsed())
                .cost(cost)
                .durationMinutes(request.getDurationMinutes())
                .build();

        EnergyUsageLog savedLog = energyLogRepository.save(logEntry);
        log.info("Manual energy log created for device {} by user {}", device.getId(), email);
        return mapToEnergyLogDto(savedLog);
    }

    // ========== SIMULATE ENERGY USAGE (for demo/testing) ==========
    @Async
    public void simulateEnergyUsage(Device device, int durationMinutes) {
        double energyUsed = (device.getPowerRating() * durationMinutes) / 60.0; // kWh
        double cost = energyUsed * COST_PER_KWH;

        EnergyUsageLog energyLog = EnergyUsageLog.builder()
                .deviceId(device.getId())
                .energyUsed(energyUsed)
                .cost(cost)
                .durationMinutes(durationMinutes)
                .build();

      energyLogRepository.save(energyLog);
log.info("Energy log created for device {}: {} kWh", device.getName(), energyUsed);
    }

    // ========== PRIVATE: Log energy usage when device turns off ==========
    private void logEnergyUsage(Device device) {
        // Simulate random duration (in real app, track actual time device was ON)
        Random random = new Random();
        int durationMinutes = random.nextInt(120) + 30; // 30-150 minutes

        double energyUsed = (device.getPowerRating() * durationMinutes) / 60.0; // kWh
        double cost = energyUsed * COST_PER_KWH;

        EnergyUsageLog energyLog = EnergyUsageLog.builder()
                .deviceId(device.getId())
                .energyUsed(energyUsed)
                .cost(cost)
                .durationMinutes(durationMinutes)
                .build();
energyLogRepository.save(energyLog);
log.info("Energy log created for device {}: {} kWh (₹{} cost)", device.getName(), energyUsed, cost);
    }

    // ========== MAPPERS ==========
    private DeviceResponseDto mapToDeviceDto(Device device) {
        return DeviceResponseDto.builder()
                .id(device.getId())
                .name(device.getName())
                .type(device.getType())
                .powerRating(device.getPowerRating())
                .status(device.getStatus())
                .room(device.getRoom())
                .userId(device.getUserId())
                .createdAt(device.getCreatedAt())
                .updatedAt(device.getUpdatedAt())
                .build();
    }

    private EnergyUsageLogResponseDto mapToEnergyLogDto(EnergyUsageLog log) {
        return EnergyUsageLogResponseDto.builder()
                .id(log.getId())
                .deviceId(log.getDeviceId())
                .timestamp(log.getTimestamp())
                .energyUsed(log.getEnergyUsed())
                .cost(log.getCost())
                .durationMinutes(log.getDurationMinutes())
                .build();
    }

    private Device findOwnedDevice(String email, Long deviceId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return deviceRepository.findByIdAndUserId(deviceId, user.getId())
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));
    }

    private Device findUserDevice(Long userId, Long deviceId) {
        return deviceRepository.findByIdAndUserId(deviceId, userId)
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));
    }

    private void ensureNotTechnician(User user) {
        if (user.getRole() == User.Role.TECHNICIAN) {
            throw new RuntimeException("Technician accounts are read-only for devices");
        }
    }
}
