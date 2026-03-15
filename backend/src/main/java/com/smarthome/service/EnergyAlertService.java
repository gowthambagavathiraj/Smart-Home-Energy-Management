package com.smarthome.service;

import com.smarthome.model.Device;
import com.smarthome.model.EnergyUsageLog;
import com.smarthome.model.Notification;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnergyAlertService {

    @Value("${app.energy.alert-threshold-kwh:3.0}")
    private double alertThresholdKwh;

    @Value("${app.energy.alert-window-minutes:60}")
    private int alertWindowMinutes;

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Scheduled(fixedDelay = 15 * 60 * 1000L, initialDelay = 60 * 1000L)
    public void checkEnergyOverload() {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusMinutes(alertWindowMinutes);

        List<User> users = userRepository.findAll();
        for (User user : users) {
            List<Device> devices = deviceRepository.findByUserId(user.getId());
            if (devices.isEmpty()) {
                continue;
            }
            List<Long> deviceIds = devices.stream().map(Device::getId).toList();
            List<EnergyUsageLog> logs = energyUsageLogRepository.findByDeviceIdsAndTimestampBetween(deviceIds, start, end);
            double energy = logs.stream()
                    .map(EnergyUsageLog::getEnergyUsed)
                    .filter(v -> v != null)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            if (energy >= alertThresholdKwh) {
                String title = "Energy overload alert";
                String message = String.format("Usage reached %.2f kWh in the last %d minutes. Consider turning off high-usage devices.",
                        energy, alertWindowMinutes);

                boolean created = notificationService.createIfNotRecent(
                        user.getId(),
                        Notification.Type.ALERT,
                        title,
                        message,
                        alertWindowMinutes
                );

                if (created) {
                    try {
                        emailService.sendEnergyAlert(user.getEmail(), user.getFirstName(), energy, alertWindowMinutes);
                    } catch (RuntimeException ex) {
                        log.warn("Failed to send alert email to {}: {}", user.getEmail(), ex.getMessage());
                    }
                }
            }
        }
    }
}
