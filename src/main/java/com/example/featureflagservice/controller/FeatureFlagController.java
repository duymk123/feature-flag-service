package com.example.featureflagservice.controller;

import com.example.featureflagservice.dto.*;
import com.example.featureflagservice.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/flags")
@RequiredArgsConstructor
@Validated
@Slf4j
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    // 1. Lấy danh sách feature flags của instance này
    @GetMapping
    public ResponseEntity<List<FeatureFlagRes>> getAll() {
        return ResponseEntity.ok(featureFlagService.GetAllFlags());
    }

    // 2. Lấy chi tiết 1 feature flag
    // 2. Lấy chi tiết 1 feature flag
    @GetMapping("/{name}")
    public ResponseEntity<FeatureFlagRes> getFlag(@PathVariable String name) {
        return ResponseEntity.ok(featureFlagService.getFlag(name));
    }

    // 2.1 Cập nhật cấp quyền (GRANT/REVOKE) từ Super Admin
    @PutMapping("/{name}/grant")
    public ResponseEntity<FeatureFlagRes> updateGrant(
            @PathVariable String name,
            @RequestParam(required = false) Boolean isGranted,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean granted = isGranted != null ? isGranted :
                (body != null && body.containsKey("isGranted") ? Boolean.TRUE.equals(body.get("isGranted")) : false);
        return ResponseEntity.ok(featureFlagService.updateFlagGrant(name, granted));
    }

    // 3. Cập nhật trạng thái ON/OFF của cờ (dành cho Tenant)
    @PutMapping({"/{name}/status", "/{name}/toggle"})   
    public ResponseEntity<FeatureFlagRes> updateStatus(
            @PathVariable String name,
            @RequestParam(required = false) Boolean enabled,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean isEnabled = enabled != null ? enabled :
                (body != null && body.containsKey("enabled") ? Boolean.TRUE.equals(body.get("enabled")) : false);
        return ResponseEntity.ok(featureFlagService.updateFlagStatus(name, isEnabled));
    }

    // 4. Cập nhật rule strategies của cờ
    @PutMapping("/{name}/strategy")
    public ResponseEntity<FeatureFlagRes> updateStrategy(
            @PathVariable String name,
            @RequestBody UpdateStrategyReq req) {
        return ResponseEntity.ok(featureFlagService.updateFlagStrategy(name, req));
    }

    // 5. Cung cấp dynamic options cho Multi-Strategy Editor từ tracking-order của instance
    @GetMapping("/strategy-options/{strategyType}")
    public ResponseEntity<List<StrategyOptionRes>> getStrategyOptions(@PathVariable String strategyType) {
        return ResponseEntity.ok(featureFlagService.getStrategyOptions(strategyType));
    }

    // 6. Lịch sử audit log
    @GetMapping("/audit")
    public ResponseEntity<List<FeatureFlagAuditRes>> getAuditLogs() {
        return ResponseEntity.ok(featureFlagService.getAuditLogs());
    }

    // 7. Evaluate 1 cờ
    @PostMapping("/evaluate")
    public ResponseEntity<Boolean> evaluateFlag(@RequestBody FeatureEvaluationRequest request) {
        return ResponseEntity.ok(featureFlagService.evaluateFlag(request));
    }

    // 8. Evaluate toàn bộ cờ
    @PostMapping("/evaluate-all")
    public ResponseEntity<FeatureFlagBulkEvaluationRes> evaluateAllFlags(@RequestBody FeatureEvaluationRequest request) {
        return ResponseEntity.ok(featureFlagService.evaluateAllFlags(request));
    }

    // 9. Apply snapshot cấu hình sang container Tracking-Order của instance này
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyToTrackingOrder() {
        return ResponseEntity.ok(featureFlagService.applyToTrackingOrder());
    }
}
