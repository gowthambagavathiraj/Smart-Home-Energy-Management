package com.smarthome.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // e.g., "AC", "Light", "Refrigerator", "Water Heater"

    @Column(name = "power_rating", nullable = false)
    private Double powerRating; // in kW

    @Column(length = 20)
    @Builder.Default
    private String status = "OFF"; // ON, OFF, STANDBY

    @Column(name = "room")
    private String room; // Optional: Living Room, Kitchen, etc.

    @Column(name = "user_id", nullable = false)
    private Long userId; // FK to users table - owner of this device

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}