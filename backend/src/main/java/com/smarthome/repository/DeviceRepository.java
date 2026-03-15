package com.smarthome.repository;

import com.smarthome.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    List<Device> findByUserId(Long userId);

    Optional<Device> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    List<Device> findByUserIdAndStatus(Long userId, String status);

    List<Device> findByStatus(String status);

    void deleteByUserId(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
