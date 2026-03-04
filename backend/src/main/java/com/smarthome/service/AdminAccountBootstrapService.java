package com.smarthome.service;

import com.smarthome.model.User;
import com.smarthome.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAccountBootstrapService {

    private final UserRepository userRepository;
    private final AdminRoleService adminRoleService;

    @PostConstruct
    @Transactional
    public void ensureConfiguredAdminsActive() {
        for (String adminEmail : adminRoleService.getAdminEmails()) {
            userRepository.findByEmail(adminEmail).ifPresent(user -> {
                boolean changed = false;
                if (user.getRole() != User.Role.ADMIN) {
                    user.setRole(User.Role.ADMIN);
                    changed = true;
                }
                if (!user.isActive()) {
                    user.setActive(true);
                    changed = true;
                }
                if (!user.isEmailVerified()) {
                    user.setEmailVerified(true);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(user);
                    log.info("Admin account normalized for {}", adminEmail);
                }
            });
        }
    }
}
