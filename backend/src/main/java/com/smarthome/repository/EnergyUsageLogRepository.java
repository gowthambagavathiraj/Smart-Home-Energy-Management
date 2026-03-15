package com.smarthome.repository;

import com.smarthome.model.EnergyUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnergyUsageLogRepository extends JpaRepository<EnergyUsageLog, Long> {

    List<EnergyUsageLog> findByDeviceIdOrderByTimestampDesc(Long deviceId);

    List<EnergyUsageLog> findByDeviceIdAndTimestampBetweenOrderByTimestampDesc(
            Long deviceId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("SELECT e FROM EnergyUsageLog e WHERE e.deviceId IN :deviceIds AND e.timestamp BETWEEN :start AND :end")
    List<EnergyUsageLog> findByDeviceIdsAndTimestampBetween(
            @Param("deviceIds") List<Long> deviceIds,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT SUM(e.energyUsed) FROM EnergyUsageLog e WHERE e.deviceId = :deviceId AND e.timestamp BETWEEN :start AND :end")
    Double sumEnergyUsedByDeviceAndDateRange(
            @Param("deviceId") Long deviceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT COALESCE(SUM(e.energyUsed), 0) FROM EnergyUsageLog e")
    Double sumTotalEnergyUsed();

    @Query("SELECT COALESCE(SUM(e.energyUsed), 0) FROM EnergyUsageLog e WHERE e.timestamp BETWEEN :start AND :end")
    Double sumEnergyUsedBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    void deleteByDeviceIdIn(List<Long> deviceIds);
}
