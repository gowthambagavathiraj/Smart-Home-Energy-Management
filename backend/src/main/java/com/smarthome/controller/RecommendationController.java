package com.smarthome.controller;

import com.smarthome.dto.RecommendationDto;
import com.smarthome.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<RecommendationDto>> getRecommendations(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(recommendationService.getRecommendations(email));
    }
}
