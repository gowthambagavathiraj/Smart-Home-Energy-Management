package com.smarthome.repository;

import com.smarthome.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndTitleAndCreatedAtAfter(Long userId, String title, LocalDateTime after);

    void deleteByUserId(Long userId);
}
