package com.smarthome.service;

import com.smarthome.dto.DeviceScheduleCreateRequestDto;
import com.smarthome.dto.DeviceScheduleResponseDto;
import com.smarthome.dto.DeviceScheduleUpdateRequestDto;
import com.smarthome.dto.DeviceUpdateRequestDto;
import com.smarthome.model.Device;
import com.smarthome.model.DeviceSchedule;
import com.smarthome.model.Notification;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.DeviceScheduleRepository;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final DeviceScheduleRepository scheduleRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DeviceService deviceService;
    private final EnergyTrackingService energyTrackingService;

    public List<DeviceScheduleResponseDto> getSchedules(String email) {
        User user = getUser(email);
        return scheduleRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public List<DeviceScheduleResponseDto> getSchedulesByDevice(String email, Long deviceId) {
        User user = getUser(email);
        return scheduleRepository.findByUserIdAndDeviceId(user.getId(), deviceId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public DeviceScheduleResponseDto createSchedule(String email, DeviceScheduleCreateRequestDto request) {
        User user = getUser(email);
        ensureNotTechnician(user);
        Device device = findOwnedDevice(user.getId(), request.getDeviceId());

        DeviceSchedule schedule = DeviceSchedule.builder()
                .deviceId(device.getId())
                .userId(user.getId())
                .action(parseAction(request.getAction()))
                .scheduleTime(LocalTime.parse(request.getTime(), TIME_FORMAT))
                .daysOfWeek(normalizeDays(request.getDaysOfWeek()))
                .enabled(request.getEnabled() == null || request.getEnabled())
                .build();
        schedule.setNextRunAt(calculateNextRun(schedule));
        return toDto(scheduleRepository.save(schedule));
    }

    @Transactional
    public DeviceScheduleResponseDto updateSchedule(String email, Long scheduleId, DeviceScheduleUpdateRequestDto request) {
        User user = getUser(email);
        ensureNotTechnician(user);
        DeviceSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        if (!schedule.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (request.getAction() != null) {
            schedule.setAction(parseAction(request.getAction()));
        }
        if (request.getTime() != null) {
            schedule.setScheduleTime(LocalTime.parse(request.getTime(), TIME_FORMAT));
        }
        if (request.getDaysOfWeek() != null) {
            schedule.setDaysOfWeek(normalizeDays(request.getDaysOfWeek()));
        }
        if (request.getEnabled() != null) {
            schedule.setEnabled(request.getEnabled());
        }
        schedule.setNextRunAt(calculateNextRun(schedule));
        return toDto(scheduleRepository.save(schedule));
    }

    @Transactional
    public void deleteSchedule(String email, Long scheduleId) {
        User user = getUser(email);
        ensureNotTechnician(user);
        DeviceSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        if (!schedule.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        scheduleRepository.delete(schedule);
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void executeSchedules() {
        LocalDateTime now = LocalDateTime.now();
        List<DeviceSchedule> dueSchedules = scheduleRepository.findByEnabledTrueAndNextRunAtLessThanEqual(now);
        if (dueSchedules.isEmpty()) {
            return;
        }

        for (DeviceSchedule schedule : dueSchedules) {
            Device device = deviceRepository.findById(schedule.getDeviceId()).orElse(null);
            if (device == null) {
                schedule.setEnabled(false);
                schedule.setNextRunAt(null);
                scheduleRepository.save(schedule);
                continue;
            }

            String desiredStatus = schedule.getAction().name();
            boolean statusChanged = !desiredStatus.equalsIgnoreCase(device.getStatus());
            if (statusChanged) {
                String userEmail = userRepository.findById(schedule.getUserId())
                        .map(User::getEmail)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                deviceService.updateDevice(userEmail, device.getId(), DeviceUpdateRequestDto.builder()
                        .status(desiredStatus)
                        .build());

                notificationService.createNotification(
                        schedule.getUserId(),
                        Notification.Type.INFO,
                        "Schedule executed",
                        String.format("%s turned %s at %s", device.getName(), desiredStatus, schedule.getScheduleTime())
                );

                if ("ON".equals(desiredStatus)) {
                    energyTrackingService.recordImmediateUsage(device, 1);
                }
            }

            schedule.setNextRunAt(calculateNextRun(schedule));
            scheduleRepository.save(schedule);
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Device findOwnedDevice(Long userId, Long deviceId) {
        return deviceRepository.findByIdAndUserId(deviceId, userId)
                .orElseThrow(() -> new RuntimeException("Device not found or access denied"));
    }

    private DeviceScheduleResponseDto toDto(DeviceSchedule schedule) {
        String deviceName = deviceRepository.findById(schedule.getDeviceId())
                .map(Device::getName)
                .orElse("Unknown");
        return DeviceScheduleResponseDto.builder()
                .id(schedule.getId())
                .deviceId(schedule.getDeviceId())
                .deviceName(deviceName)
                .action(schedule.getAction().name())
                .time(schedule.getScheduleTime().format(TIME_FORMAT))
                .daysOfWeek(schedule.getDaysOfWeek())
                .enabled(schedule.isEnabled())
                .nextRunAt(schedule.getNextRunAt())
                .build();
    }

    private DeviceSchedule.Action parseAction(String action) {
        return DeviceSchedule.Action.valueOf(action.trim().toUpperCase());
    }

    private String normalizeDays(String daysOfWeek) {
        if (daysOfWeek == null || daysOfWeek.isBlank()) {
            return "";
        }
        return Arrays.stream(daysOfWeek.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .map(this::normalizeDayToken)
                .distinct()
                .collect(Collectors.joining(","));
    }

    private LocalDateTime calculateNextRun(DeviceSchedule schedule) {
        if (!schedule.isEnabled()) {
            return null;
        }
        Set<DayOfWeek> days = parseDays(schedule.getDaysOfWeek());
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);

        for (int i = 0; i <= 7; i++) {
            LocalDate date = now.toLocalDate().plusDays(i);
            DayOfWeek day = date.getDayOfWeek();
            if (!days.isEmpty() && !days.contains(day)) {
                continue;
            }
            LocalDateTime candidate = date.atTime(schedule.getScheduleTime());
            if (!candidate.isBefore(now)) {
                return candidate;
            }
        }
        return now.plusDays(1).withHour(schedule.getScheduleTime().getHour()).withMinute(schedule.getScheduleTime().getMinute());
    }

    private Set<DayOfWeek> parseDays(String daysOfWeek) {
        if (daysOfWeek == null || daysOfWeek.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(daysOfWeek.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .map(this::mapDayOfWeek)
                .collect(Collectors.toSet());
    }

    private String normalizeDayToken(String token) {
        return switch (token) {
            case "MON", "MONDAY" -> "MON";
            case "TUE", "TUES", "TUESDAY" -> "TUE";
            case "WED", "WEDNESDAY" -> "WED";
            case "THU", "THUR", "THURS", "THURSDAY" -> "THU";
            case "FRI", "FRIDAY" -> "FRI";
            case "SAT", "SATURDAY" -> "SAT";
            case "SUN", "SUNDAY" -> "SUN";
            default -> token;
        };
    }

    private DayOfWeek mapDayOfWeek(String token) {
        return switch (token) {
            case "MON", "MONDAY" -> DayOfWeek.MONDAY;
            case "TUE", "TUES", "TUESDAY" -> DayOfWeek.TUESDAY;
            case "WED", "WEDNESDAY" -> DayOfWeek.WEDNESDAY;
            case "THU", "THUR", "THURS", "THURSDAY" -> DayOfWeek.THURSDAY;
            case "FRI", "FRIDAY" -> DayOfWeek.FRIDAY;
            case "SAT", "SATURDAY" -> DayOfWeek.SATURDAY;
            case "SUN", "SUNDAY" -> DayOfWeek.SUNDAY;
            default -> throw new RuntimeException("Invalid day token: " + token);
        };
    }

    private void ensureNotTechnician(User user) {
        if (user.getRole() == User.Role.TECHNICIAN) {
            throw new RuntimeException("Technician accounts cannot manage schedules");
        }
    }
}
