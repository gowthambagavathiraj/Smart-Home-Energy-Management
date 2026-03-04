package com.smarthome.security;

import com.smarthome.model.User;
import com.smarthome.repository.UserRepository;
import com.smarthome.service.AdminRoleService;
import com.smarthome.service.LoginAuditService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AdminRoleService adminRoleService;
    private final LoginAuditService loginAuditService;

    @Value("${app.oauth2.redirect-uri}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String providerId = oAuth2User.getAttribute("sub");

        // Find or create user
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setRole(adminRoleService.resolveRoleByEmail(email, user.getRole()));
            user.setEmailVerified(true);
            userRepository.save(user);
        } else {
            // New Google user — default role is HOMEOWNER
            user = User.builder()
                    .email(email)
                    .firstName(firstName != null ? firstName : "Google")
                    .lastName(lastName != null ? lastName : "User")
                    .provider(User.AuthProvider.GOOGLE)
                    .providerId(providerId)
                    .role(adminRoleService.resolveRoleByEmail(email, User.Role.HOMEOWNER))
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(user);
        }

        loginAuditService.registerSuccessfulLogin(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(email);

        // Redirect to frontend dashboard with token and user info
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendRedirectUri + "/dashboard")
                .queryParam("token", token)
                .queryParam("firstName", user.getFirstName())
                .queryParam("lastName", user.getLastName())
                .queryParam("email", user.getEmail())
                .queryParam("role", user.getRole().name())
                .queryParam("provider", user.getProvider().name())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
