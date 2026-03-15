package com.smarthome.service;

import com.smarthome.dto.RecommendationDto;
import com.smarthome.model.Device;
import com.smarthome.model.EnergyUsageLog;
import com.smarthome.model.User;
import com.smarthome.repository.DeviceRepository;
import com.smarthome.repository.EnergyUsageLogRepository;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;

    public List<RecommendationDto> getRecommendations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return getRecommendationsForUser(user);
    }

    public List<RecommendationDto> getRecommendationsForUser(User user) {
        List<Device> devices = deviceRepository.findByUserId(user.getId());
        if (devices.isEmpty()) {
            return List.of(RecommendationDto.builder()
                    .title("Add your first device")
                    .message("Connect a device to start tracking energy and get personalized recommendations.")
                    .category("Getting Started")
                    .savingsPercent(0.0)
                    .build());
        }

        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(7);
        List<Long> deviceIds = devices.stream().map(Device::getId).toList();
        List<EnergyUsageLog> logs = energyUsageLogRepository.findByDeviceIdsAndTimestampBetween(deviceIds, start, end);

        if (logs.isEmpty()) {
            return List.of(RecommendationDto.builder()
                    .title("No usage data yet")
                    .message("Turn devices on to generate usage data and receive energy-saving tips.")
                    .category("Getting Started")
                    .savingsPercent(0.0)
                    .build());
        }

        List<RecommendationDto> recommendations = new ArrayList<>();

        double[] hourlyBuckets = new double[24];
        for (EnergyUsageLog log : logs) {
            if (log.getTimestamp() == null || log.getEnergyUsed() == null) continue;
            hourlyBuckets[log.getTimestamp().getHour()] += log.getEnergyUsed();
        }
        int peakHour = indexOf(hourlyBuckets, Arrays.stream(hourlyBuckets).max().orElse(0));
        if (peakHour >= 18 && peakHour <= 22) {
            recommendations.add(RecommendationDto.builder()
                    .title("Shift heavy usage after 8 PM")
                    .message("Your peak usage happens around evening hours. Shifting AC or washing loads after 8 PM can reduce costs by ~15%.")
                    .category("Time-of-Use")
                    .savingsPercent(15.0)
                    .build());
        }

        Map<Long, Double> deviceEnergy = new HashMap<>();
        for (EnergyUsageLog log : logs) {
            if (log.getEnergyUsed() == null) continue;
            deviceEnergy.merge(log.getDeviceId(), log.getEnergyUsed(), Double::sum);
        }
        double totalEnergy = deviceEnergy.values().stream().mapToDouble(Double::doubleValue).sum();
        Long topDeviceId = deviceEnergy.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        if (topDeviceId != null && totalEnergy > 0) {
            double topShare = deviceEnergy.get(topDeviceId) / totalEnergy;
            if (topShare >= 0.4) {
                String deviceName = devices.stream().filter(d -> d.getId().equals(topDeviceId))
                        .map(Device::getName)
                        .findFirst().orElse("a device");
                recommendations.add(RecommendationDto.builder()
                        .title("Reduce usage of " + deviceName)
                        .message(deviceName + " accounts for a large portion of your energy use. Consider shorter usage windows or eco mode.")
                        .category("Device Optimization")
                        .savingsPercent(10.0)
                        .build());
            }
        }

        double avgDaily = totalEnergy / 7.0;
        if (avgDaily > 8.0) {
            recommendations.add(RecommendationDto.builder()
                    .title("Set schedules for high-usage devices")
                    .message("Your average daily usage is high. Use schedules to automate ON/OFF during off-peak hours.")
                    .category("Automation")
                    .savingsPercent(12.0)
                    .build());
        }

        if (recommendations.isEmpty()) {
            recommendations.add(RecommendationDto.builder()
                    .title("Usage looks balanced")
                    .message("Your energy usage is steady. Keep monitoring to maintain efficiency.")
                    .category("General")
                    .savingsPercent(0.0)
                    .build());
        }

        return recommendations;
    }

    private int indexOf(double[] values, double target) {
        for (int i = 0; i < values.length; i++) {
            if (Double.compare(values[i], target) == 0) {
                return i;
            }
        }
        return 0;
    }
}
