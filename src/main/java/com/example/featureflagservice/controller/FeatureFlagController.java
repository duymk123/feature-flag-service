package com.example.featureflagservice.controller;

import com.example.featureflagservice.dto.CreateCustomerReq;
import com.example.featureflagservice.dto.CustomerFeatureFlagReq;
import com.example.featureflagservice.dto.CustomerFeatureFlagRes;
import com.example.featureflagservice.dto.CustomerRes;
import com.example.featureflagservice.dto.FeatureEvaluationRequest;
import com.example.featureflagservice.dto.FeatureFlagAuditRes;
import com.example.featureflagservice.dto.FeatureFlagRes;
import com.example.featureflagservice.dto.UpdateStrategyReq;
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

    // api lấy ra tracking log
    @GetMapping("/audit")
    public ResponseEntity<List<FeatureFlagAuditRes>> getAuditLogs() {
        return ResponseEntity.ok(featureFlagService.getAuditLogs());
    }

    //api apply feature-flag global
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyToTrackingOrder() {
        return ResponseEntity.ok(featureFlagService.applyToTrackingOrder());
    }

    // Endpoint dành riêng để Apply snapshot cho một Customer cụ thể (cho từng customer)
    @PostMapping("/apply/{customerCode}")
    public ResponseEntity<Map<String, Object>> applyToCustomer(@PathVariable String customerCode) {
        return ResponseEntity.ok(featureFlagService.applyToCustomer(customerCode));
    }

    //lấy customer
    @GetMapping("/customers")
    public ResponseEntity<List<CustomerRes>> getCustomers() {
        return ResponseEntity.ok(featureFlagService.getCustomers());
    }

    // tạo 1 customer mới
    @PostMapping("/customers")
    public ResponseEntity<CustomerRes> createCustomer(@RequestBody CreateCustomerReq request) {
        return ResponseEntity.ok(featureFlagService.createCustomer(request));
    }

    //cập nhật thông tin customer
    @PutMapping("/customers/{customerCode}")
    public ResponseEntity<CustomerRes> updateCustomer(
            @PathVariable String customerCode,
            @RequestBody CreateCustomerReq request)
    {
        return ResponseEntity.ok(featureFlagService.updateCustomer(customerCode, request));
    }

    // xóa thông tin customer
    @DeleteMapping("/customers/{customerCode}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String customerCode) {
        featureFlagService.deleteCustomer(customerCode);
        return ResponseEntity.ok().build();
    }

    //lấy ra flag của customer
    @GetMapping("/customers/{customerCode}/features")
    public ResponseEntity<List<CustomerFeatureFlagRes>> getCustomerFeatureFlags(@PathVariable String customerCode) {
        return ResponseEntity.ok(featureFlagService.getCustomerFeatureFlags(customerCode));
    }

    //update feature-flag(bật, tắt, sửa strategy)
    @PutMapping("/customers/{customerCode}/features/{flagName}")
    public ResponseEntity<CustomerFeatureFlagRes> updateCustomerFeatureFlag(
            @PathVariable String customerCode,
            @PathVariable String flagName,
            @RequestBody CustomerFeatureFlagReq request
    ) {
        return ResponseEntity.ok(featureFlagService.updateCustomerFeatureFlag(customerCode, flagName, request));
    }

    //get all flag
    @GetMapping
    public ResponseEntity<List<FeatureFlagRes>> getAll() {
        return ResponseEntity.ok(featureFlagService.GetAllFlags());
    }

    // get flag detail
    @GetMapping("/{name}")
    public ResponseEntity<FeatureFlagRes> getFlag(@PathVariable String name) {
        return ResponseEntity.ok(featureFlagService.getFlag(name));
    }

    //turn on/off feature-flag
    @PutMapping("/{name}/toggle")
    public ResponseEntity<FeatureFlagRes> toggleFlag(@PathVariable String name, @RequestParam boolean enabled) {
        return ResponseEntity.ok(featureFlagService.updateFlagStatus(name, enabled));
    }

    // update strategy
    @PutMapping("/{name}/strategy")
    public ResponseEntity<FeatureFlagRes> updateStrategy(@PathVariable String name, @RequestBody UpdateStrategyReq request) {
        return ResponseEntity.ok(featureFlagService.updateFlagStrategy(name, request));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Boolean>> evaluateFlag(@RequestBody FeatureEvaluationRequest request) {
        try {
            boolean active = featureFlagService.evaluateFlag(request);
            return ResponseEntity.ok(Map.of("enabled", active));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("enabled", false));
        }
    }
}
