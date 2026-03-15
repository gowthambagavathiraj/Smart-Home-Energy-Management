package com.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long loggedInUsers;
    private long totalDevices;
    private long installations;
    private double totalEnergyUsage;
    private long activeDevices;
    private double monthlyEnergyUsage;
    private double co2Reduction;
    private long adminCount;
    private long homeownerCount;
    private long technicianCount;
}
