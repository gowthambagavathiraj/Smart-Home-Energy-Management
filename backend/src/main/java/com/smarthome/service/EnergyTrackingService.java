package com.smarthome.service;

import com.smarthome.dto.DeviceLiveUsageDto;
import com.smarthome.dto.EnergyAnalyticsResponseDto;
import com.smarthome.dto.EnergyComparisonDto;
import com.smarthome.dto.EnergyConsumptionPointDto;
import com.smarthome.dto.EnergyConsumptionResponseDto;
import com.smarthome.dto.EnergyCostPredictionDto;
import com.smarthome.dto.PeakOffPeakDto;
import com.smarthome.dto.RealtimeUsageResponseDto;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnergyTrackingService {

    private static final int SIMULATION_INTERVAL_MINUTES = 5;
    private static final double POWER_ALERT_THRESHOLD_KW = 15.0;

    @Value("${app.energy.rate-per-kwh:0.12}")
    private double ratePerKwh;

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final EnergyUsageLogRepository energyUsageLogRepository;
    private final DummyIotPowerService dummyIotPowerService;
    private final NotificationService notificationService;

    public RealtimeUsageResponseDto getRealtimeUsage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return getRealtimeUsageForUser(user);
    }

    public RealtimeUsageResponseDto getRealtimeUsageForUser(User user) {
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

        return getConsumptionForUser(user, period, points);
    }

    public EnergyConsumptionResponseDto getConsumptionForUser(User user, String period, int points) {
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
        } else if ("weekly".equals(normalizedPeriod)) {
            LocalDate currentWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
            from = currentWeekStart.minusWeeks(safePoints - 1L).atStartOfDay();
            for (int i = safePoints - 1; i >= 0; i--) {
                LocalDate startDate = currentWeekStart.minusWeeks(i);
                LocalDateTime start = startDate.atStartOfDay();
                LocalDateTime end = start.plusDays(7);
                responsePoints.add(buildPoint(userDevices, start, end, startDate.format(DateTimeFormatter.ofPattern("dd MMM"))));
            }
        } else if ("monthly".equals(normalizedPeriod)) {
            YearMonth currentMonth = YearMonth.now();
            YearMonth firstMonth = currentMonth.minusMonths(safePoints - 1L);
            from = firstMonth.atDay(1).atStartOfDay();
            for (int i = safePoints - 1; i >= 0; i--) {
                YearMonth target = currentMonth.minusMonths(i);
                LocalDateTime start = target.atDay(1).atStartOfDay();
                LocalDateTime end = start.plusMonths(1);
                responsePoints.add(buildPoint(userDevices, start, end, target.format(DateTimeFormatter.ofPattern("MMM yyyy"))));
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
            throw new RuntimeException("Unsupported period. Use hourly, daily, weekly, or monthly.");
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
            maybeNotifyPowerLimit(device, livePower);

            double energyUsed = livePower * (SIMULATION_INTERVAL_MINUTES / 60.0);
            double cost = energyUsed * ratePerKwh;

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

    @Transactional
    public void recordImmediateUsage(Device device, int durationMinutes) {
        if (device == null || !"ON".equals(device.getStatus())) {
            return;
        }
        double livePower = dummyIotPowerService.readLivePowerKw(device);
        if (livePower <= 0) {
            return;
        }
        double energyUsed = livePower * (durationMinutes / 60.0);
        double cost = energyUsed * ratePerKwh;

        EnergyUsageLog logEntry = EnergyUsageLog.builder()
                .deviceId(device.getId())
                .timestamp(LocalDateTime.now())
                .energyUsed(round(energyUsed))
                .cost(round(cost))
                .durationMinutes(durationMinutes)
                .build();

        energyUsageLogRepository.save(logEntry);
    }

    public EnergyAnalyticsResponseDto getAnalytics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return getAnalyticsForUser(user);
    }

    public EnergyAnalyticsResponseDto getAnalyticsForUser(User user) {
        List<Device> userDevices = deviceRepository.findByUserId(user.getId());
        if (userDevices.isEmpty()) {
            return EnergyAnalyticsResponseDto.builder()
                    .dailyPoints(List.of())
                    .weeklyPoints(List.of())
                    .monthlyPoints(List.of())
                    .totalEnergyLast7Days(0.0)
                    .totalCostLast7Days(0.0)
                    .comparison(emptyComparison())
                    .costPrediction(emptyCostPrediction())
                    .peakOffPeak(emptyPeakOffPeak())
                    .build();
        }

        List<EnergyConsumptionPointDto> dailyPoints = buildDailyPoints(userDevices, 7);
        List<EnergyConsumptionPointDto> weeklyPoints = buildWeeklyPoints(userDevices, 4);
        List<EnergyConsumptionPointDto> monthlyPoints = buildMonthlyPoints(userDevices, 6);

        double totalEnergyLast7Days = dailyPoints.stream().mapToDouble(EnergyConsumptionPointDto::getEnergyUsed).sum();
        double totalCostLast7Days = dailyPoints.stream().mapToDouble(EnergyConsumptionPointDto::getCost).sum();

        EnergyComparisonDto comparison = buildWeekComparison(userDevices);
        PeakOffPeakDto peakOffPeak = buildPeakOffPeak(userDevices);
        EnergyCostPredictionDto costPrediction = buildCostPrediction(totalEnergyLast7Days);

        return EnergyAnalyticsResponseDto.builder()
                .dailyPoints(dailyPoints)
                .weeklyPoints(weeklyPoints)
                .monthlyPoints(monthlyPoints)
                .totalEnergyLast7Days(round(totalEnergyLast7Days))
                .totalCostLast7Days(round(totalCostLast7Days))
                .comparison(comparison)
                .costPrediction(costPrediction)
                .peakOffPeak(peakOffPeak)
                .build();
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

    private List<EnergyConsumptionPointDto> buildDailyPoints(List<Device> devices, int days) {
        List<EnergyConsumptionPointDto> points = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = start.plusDays(1);
            points.add(buildPoint(devices, start, end, day.format(DateTimeFormatter.ofPattern("dd MMM"))));
        }
        return points;
    }

    private List<EnergyConsumptionPointDto> buildWeeklyPoints(List<Device> devices, int weeks) {
        List<EnergyConsumptionPointDto> points = new ArrayList<>();
        LocalDate currentWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        for (int i = weeks - 1; i >= 0; i--) {
            LocalDate startDate = currentWeekStart.minusWeeks(i);
            LocalDateTime start = startDate.atStartOfDay();
            LocalDateTime end = start.plusDays(7);
            points.add(buildPoint(devices, start, end, startDate.format(DateTimeFormatter.ofPattern("dd MMM"))));
        }
        return points;
    }

    private List<EnergyConsumptionPointDto> buildMonthlyPoints(List<Device> devices, int months) {
        List<EnergyConsumptionPointDto> points = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth target = currentMonth.minusMonths(i);
            LocalDateTime start = target.atDay(1).atStartOfDay();
            LocalDateTime end = start.plusMonths(1);
            points.add(buildPoint(devices, start, end, target.format(DateTimeFormatter.ofPattern("MMM yyyy"))));
        }
        return points;
    }

    private EnergyComparisonDto buildWeekComparison(List<Device> devices) {
        LocalDate currentWeekStartDate = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDateTime currentStart = currentWeekStartDate.atStartOfDay();
        LocalDateTime currentEnd = currentStart.plusDays(7);
        LocalDateTime previousStart = currentStart.minusWeeks(1);
        LocalDateTime previousEnd = currentStart;

        double currentEnergy = aggregateEnergy(devices, currentStart, currentEnd);
        double previousEnergy = aggregateEnergy(devices, previousStart, previousEnd);
        double delta = currentEnergy - previousEnergy;
        double deltaPercent = previousEnergy <= 0 ? 0.0 : (delta / previousEnergy) * 100.0;

        String trend = delta > 0.01 ? "UP" : (delta < -0.01 ? "DOWN" : "FLAT");

        return EnergyComparisonDto.builder()
                .currentLabel(currentWeekStartDate.format(DateTimeFormatter.ofPattern("dd MMM")))
                .previousLabel(currentWeekStartDate.minusWeeks(1).format(DateTimeFormatter.ofPattern("dd MMM")))
                .currentEnergy(round(currentEnergy))
                .previousEnergy(round(previousEnergy))
                .deltaEnergy(round(delta))
                .deltaPercent(round(deltaPercent))
                .trend(trend)
                .build();
    }

    private PeakOffPeakDto buildPeakOffPeak(List<Device> devices) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(7);
        List<Long> deviceIds = devices.stream().map(Device::getId).toList();
        List<EnergyUsageLog> logs = energyUsageLogRepository.findByDeviceIdsAndTimestampBetween(deviceIds, start, end);

        double[] buckets = new double[24];
        for (EnergyUsageLog log : logs) {
            if (log.getTimestamp() == null || log.getEnergyUsed() == null) {
                continue;
            }
            int hour = log.getTimestamp().getHour();
            buckets[hour] += log.getEnergyUsed();
        }

        double max = Arrays.stream(buckets).max().orElse(0.0);
        double min = Arrays.stream(buckets).min().orElse(0.0);
        int peakHour = indexOf(buckets, max);
        int offPeakHour = indexOf(buckets, min);

        return PeakOffPeakDto.builder()
                .peakHour(formatHour(peakHour))
                .offPeakHour(formatHour(offPeakHour))
                .peakEnergy(round(max))
                .offPeakEnergy(round(min))
                .build();
    }

    private EnergyCostPredictionDto buildCostPrediction(double totalEnergyLast7Days) {
        double averageDaily = totalEnergyLast7Days / 7.0;
        double estimatedDailyCost = averageDaily * ratePerKwh;
        double estimatedMonthlyCost = averageDaily * 30.0 * ratePerKwh;

        return EnergyCostPredictionDto.builder()
                .ratePerKwh(round(ratePerKwh))
                .averageDailyKwh(round(averageDaily))
                .estimatedDailyCost(round(estimatedDailyCost))
                .estimatedMonthlyCost(round(estimatedMonthlyCost))
                .build();
    }

    private double aggregateEnergy(List<Device> devices, LocalDateTime start, LocalDateTime end) {
        List<Long> deviceIds = devices.stream().map(Device::getId).toList();
        List<EnergyUsageLog> logs = energyUsageLogRepository.findByDeviceIdsAndTimestampBetween(deviceIds, start, end);
        return logs.stream()
                .map(EnergyUsageLog::getEnergyUsed)
                .filter(v -> v != null)
                .mapToDouble(Double::doubleValue)
                .sum();
    }

    private int indexOf(double[] values, double target) {
        for (int i = 0; i < values.length; i++) {
            if (Double.compare(values[i], target) == 0) {
                return i;
            }
        }
        return 0;
    }

    private String formatHour(int hour) {
        int displayHour = hour % 12 == 0 ? 12 : hour % 12;
        String suffix = hour < 12 ? "AM" : "PM";
        return displayHour + " " + suffix;
    }

    private EnergyComparisonDto emptyComparison() {
        return EnergyComparisonDto.builder()
                .currentLabel("This Week")
                .previousLabel("Last Week")
                .currentEnergy(0.0)
                .previousEnergy(0.0)
                .deltaEnergy(0.0)
                .deltaPercent(0.0)
                .trend("FLAT")
                .build();
    }

    private EnergyCostPredictionDto emptyCostPrediction() {
        return EnergyCostPredictionDto.builder()
                .ratePerKwh(round(ratePerKwh))
                .averageDailyKwh(0.0)
                .estimatedDailyCost(0.0)
                .estimatedMonthlyCost(0.0)
                .build();
    }

    private PeakOffPeakDto emptyPeakOffPeak() {
        return PeakOffPeakDto.builder()
                .peakHour("N/A")
                .offPeakHour("N/A")
                .peakEnergy(0.0)
                .offPeakEnergy(0.0)
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private void maybeNotifyPowerLimit(Device device, double livePower) {
        if (device.getPowerRating() == null) {
            return;
        }
        double rating = device.getPowerRating();
        if (rating < POWER_ALERT_THRESHOLD_KW) {
            return;
        }
        if (livePower < (rating * 0.98)) {
            return;
        }
        String title = "Power limit reached";
        String message = String.format("%s reached %.2f kW (limit %.2f kW).", device.getName(), round(livePower), round(rating));
        notificationService.createIfNotRecent(device.getUserId(), Notification.Type.ALERT, title, message, 30);
    }
}
