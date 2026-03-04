package com.smarthome.service;

import com.smarthome.dto.DeviceLiveUsageDto;
import com.smarthome.dto.EnergyConsumptionPointDto;
import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
import com.smarthome.model.Device;
import com.smarthome.model.EnergyUsageLog;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnergyTrackingService {

    private static final double COST_PER_KWH = 0.12;
    private static final int SIMULATION_INTERVAL_MINUTES = 5;

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;
    private final DummyIotPowerService dummyIotPowerService;

    public RealtimeUsageResponseDto getRealtimeUsage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Device> userDevices = deviceRepository.findByUserId(user.getId());
        List<DeviceLiveUsageDto> liveDeviceData = new ArrayList<>();
        double totalPower = 0.0;
        int activeDevices = 0;

        for (Device device : userDevices) {
            double livePower = dummyIotPowerService.readLivePowerKw(device);
            if (livePower > 0) {
                activeDevices++;
            }
            totalPower += livePower;

            liveDeviceData.add(DeviceLiveUsageDto.builder()
                    .deviceId(device.getId())
                    .deviceName(device.getName())
                    .type(device.getType())
                    .status(device.getStatus())
                    .powerKw(round(livePower))
                    .build());
        }

        return RealtimeUsageResponseDto.builder()
                .timestamp(LocalDateTime.now())
                .totalPowerKw(round(totalPower))
                .activeDevices(activeDevices)
                .totalDevices(userDevices.size())
                .devices(liveDeviceData)
                .build();
    }

    public EnergyConsumptionResponseDto getConsumption(String email, String period, int points) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Device> userDevices = deviceRepository.findByUserId(user.getId());
        if (userDevices.isEmpty()) {
            return EnergyConsumptionResponseDto.builder()
                    .period(period)
                    .from(LocalDateTime.now())
                    .to(LocalDateTime.now())
                    .totalEnergy(0.0)
                    .totalCost(0.0)
                    .points(List.of())
                    .build();
        }

        LocalDateTime to = LocalDateTime.now();
        List<EnergyConsumptionPointDto> responsePoints = new ArrayList<>();

        String normalizedPeriod = period == null ? "hourly" : period.toLowerCase().trim();
        int safePoints = Math.max(1, Math.min(points, 60));

        LocalDateTime from;
        if ("daily".equals(normalizedPeriod)) {
            from = to.minusDays(safePoints - 1L).toLocalDate().atStartOfDay();
            for (int i = safePoints - 1; i >= 0; i--) {
                LocalDate day = LocalDate.now().minusDays(i);
                LocalDateTime start = day.atStartOfDay();
                LocalDateTime end = start.plusDays(1);
                responsePoints.add(buildPoint(userDevices, start, end, day.format(DateTimeFormatter.ofPattern("dd MMM"))));
            }
        } else if ("hourly".equals(normalizedPeriod)) {
            LocalDateTime aligned = to.withMinute(0).withSecond(0).withNano(0);
            from = aligned.minusHours(safePoints - 1L);
            for (int i = safePoints - 1; i >= 0; i--) {
                LocalDateTime start = aligned.minusHours(i);
                LocalDateTime end = start.plusHours(1);
                responsePoints.add(buildPoint(userDevices, start, end, start.format(DateTimeFormatter.ofPattern("ha"))));
            }
        } else {
            throw new RuntimeException("Unsupported period. Use hourly or daily.");
        }

        double totalEnergy = responsePoints.stream().mapToDouble(EnergyConsumptionPointDto::getEnergyUsed).sum();
        double totalCost = responsePoints.stream().mapToDouble(EnergyConsumptionPointDto::getCost).sum();

        return EnergyConsumptionResponseDto.builder()
                .period(normalizedPeriod)
                .from(from)
                .to(to)
                .totalEnergy(round(totalEnergy))
                .totalCost(round(totalCost))
                .points(responsePoints)
                .build();
    }

    @Scheduled(fixedDelay = SIMULATION_INTERVAL_MINUTES * 60 * 1000L, initialDelay = 30 * 1000L)
    @Transactional
    public void simulateActiveDeviceEnergyLogs() {
        List<Device> activeDevices = deviceRepository.findByStatus("ON");
        if (activeDevices.isEmpty()) {
            return;
        }

        for (Device device : activeDevices) {
            double livePower = dummyIotPowerService.readLivePowerKw(device);
            if (livePower <= 0) {
                continue;
            }

            double energyUsed = livePower * (SIMULATION_INTERVAL_MINUTES / 60.0);
            double cost = energyUsed * COST_PER_KWH;

            EnergyUsageLog logEntry = EnergyUsageLog.builder()
                    .deviceId(device.getId())
                    .timestamp(LocalDateTime.now())
                    .energyUsed(round(energyUsed))
                    .cost(round(cost))
                    .durationMinutes(SIMULATION_INTERVAL_MINUTES)
                    .build();

            energyUsageLogRepository.save(logEntry);
        }
        log.debug("Simulated IoT energy logs for {} active devices", activeDevices.size());
    }

    private EnergyConsumptionPointDto buildPoint(List<Device> devices, LocalDateTime start, LocalDateTime end, String label) {
        List<Long> deviceIds = devices.stream().map(Device::getId).toList();
        List<EnergyUsageLog> logs = energyUsageLogRepository.findByDeviceIdsAndTimestampBetween(deviceIds, start, end);

        double energy = logs.stream().map(EnergyUsageLog::getEnergyUsed)
                .filter(v -> v != null)
                .mapToDouble(Double::doubleValue)
                .sum();
        double cost = logs.stream().map(EnergyUsageLog::getCost)
                .filter(v -> v != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        return EnergyConsumptionPointDto.builder()
                .label(label)
                .start(start)
                .end(end)
                .energyUsed(round(energy))
                .cost(round(cost))
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
