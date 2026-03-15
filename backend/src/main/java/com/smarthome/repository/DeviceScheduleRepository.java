package com.smarthome.repository;

import com.smarthome.model.DeviceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeviceScheduleRepository extends JpaRepository<DeviceSchedule, Long> {

    List<DeviceSchedule> findByUserId(Long userId);

    List<DeviceSchedule> findByDeviceId(Long deviceId);

    List<DeviceSchedule> findByUserIdAndDeviceId(Long userId, Long deviceId);

    List<DeviceSchedule> findByEnabledTrueAndNextRunAtLessThanEqual(LocalDateTime time);

    List<DeviceSchedule> findByEnabledTrue();

    void deleteByUserId(Long userId);

    void deleteByDeviceIdIn(List<Long> deviceIds);
}
