-- ============================================================
-- Smart Home Energy Management System - Database Schema
-- ============================================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS smarthome_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smarthome_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255),                    -- NULL for Google OAuth users
    provider    ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(255),                    -- Google sub ID
    role        ENUM('HOMEOWNER', 'TECHNICIAN', 'ADMIN') NOT NULL DEFAULT 'HOMEOWNER',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    login_count BIGINT NOT NULL DEFAULT 0,
    last_login_at DATETIME,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME,

    INDEX idx_users_email (email),
    INDEX idx_users_provider (provider),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMAIL VERIFICATION TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(6)   NOT NULL,
    email       VARCHAR(150) NOT NULL,
    expires_at  DATETIME NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_evt_email (email),
    INDEX idx_evt_email_code (email, code),
    INDEX idx_evt_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(6)   NOT NULL,
    email       VARCHAR(150) NOT NULL,
    expires_at  DATETIME NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_prt_email (email),
    INDEX idx_prt_email_code (email, code),
    INDEX idx_prt_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    type          VARCHAR(50)  NOT NULL,
    power_rating  DOUBLE       NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'OFF',
    room          VARCHAR(50),
    user_id       BIGINT       NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME,

    CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_devices_user_id (user_id),
    INDEX idx_devices_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ENERGY USAGE LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS energy_usage_logs (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id         BIGINT   NOT NULL,
    timestamp         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    energy_used       DOUBLE   NOT NULL,
    cost              DOUBLE,
    duration_minutes  INT,

    CONSTRAINT fk_energy_logs_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_logs_device_id (device_id),
    INDEX idx_logs_timestamp (timestamp),
    INDEX idx_logs_device_timestamp (device_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VERIFICATION: Check tables created
-- ============================================================
SHOW TABLES;
DESCRIBE users;
DESCRIBE email_verification_tokens;
DESCRIBE password_reset_tokens;
DESCRIBE devices;
DESCRIBE energy_usage_logs;
