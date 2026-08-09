package com.example.featureflagservice.controller;

import com.example.featureflagservice.dto.FeatureEvaluationRequest;
import com.example.featureflagservice.dto.FeatureFlagRes;
import com.example.featureflagservice.dto.UpdateStrategyReq;
import com.example.featureflagservice.dto.FeatureFlagAuditRes;
import com.example.featureflagservice.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/flags")
@RequiredArgsConstructor
@Validated
@Slf4j
public class FeatureFlagController {
    private final FeatureFlagService featureFlagService;

    @GetMapping("/audit")
    public ResponseEntity<List<FeatureFlagAuditRes>> getAuditLogs() {
        return ResponseEntity.ok(featureFlagService.getAuditLogs());
    }

    @GetMapping //api lấy ra hết các flags
    public ResponseEntity<List<FeatureFlagRes>> getAll(){
        return ResponseEntity.ok(featureFlagService.GetAllFlags());
    }

    @GetMapping("/{name}") //get Flag detail
    public ResponseEntity<FeatureFlagRes> getFlag(@PathVariable String name){
        return ResponseEntity.ok(featureFlagService.getFlag(name));
    }

    @PutMapping("/{name}/toggle") // bật tắt Flag
    public ResponseEntity<FeatureFlagRes> toggleFlag(@PathVariable String name, @RequestParam boolean enabled) {
        return ResponseEntity.ok(featureFlagService.updateFlagStatus(name, enabled));
    }

    @PutMapping("/{name}/strategy")
    public ResponseEntity<FeatureFlagRes> updateStrategy(@PathVariable String name, @RequestBody UpdateStrategyReq request) {
        return ResponseEntity.ok(featureFlagService.updateFlagStrategy(name, request));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<java.util.Map<String, Boolean>> evaluateFlag(@RequestBody FeatureEvaluationRequest request) {
        try {
            boolean active = featureFlagService.evaluateFlag(request);
            return ResponseEntity.ok(java.util.Map.of("enabled", active));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("enabled", false));
        }
    }
}
