package com.smarthome.service;

import com.smarthome.model.User;
import com.smarthome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoginAuditService {

    private final UserRepository userRepository;

    @Transactional
    public void registerSuccessfulLogin(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        Long count = user.getLoginCount() == null ? 0L : user.getLoginCount();
        user.setLoginCount(count + 1);
        userRepository.save(user);
    }
}
