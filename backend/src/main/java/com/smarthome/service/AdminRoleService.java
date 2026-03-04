package com.smarthome.service;

import com.smarthome.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRoleService {

    @Value("${app.admin.emails:}")
    private String adminEmailsConfig;

    public Set<String> getAdminEmails() {
        Set<String> emails = Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        return Collections.unmodifiableSet(emails);
    }

    public boolean isAdminEmail(String email) {
        return getAdminEmails().contains(email.toLowerCase().trim());
    }

    public User.Role resolveRoleByEmail(String email, User.Role fallbackRole) {
        if (isAdminEmail(email)) {
            return User.Role.ADMIN;
        }

        if (fallbackRole == User.Role.ADMIN) {
            return User.Role.HOMEOWNER;
        }

        return fallbackRole;
    }
}
