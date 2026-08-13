package com.example.featureflagservice.service;

import com.example.featureflagservice.dto.FeatureEvaluationRequest;
import com.example.featureflagservice.dto.FeatureFlagRes;
import com.example.featureflagservice.dto.UpdateStrategyReq;
import com.example.featureflagservice.dto.CreateCustomerReq;
import com.example.featureflagservice.dto.CustomerFeatureFlagReq;
import com.example.featureflagservice.dto.CustomerFeatureFlagRes;
import com.example.featureflagservice.dto.CustomerRes;

import java.util.List;
import java.util.Map;

public interface FeatureFlagService {
    List<FeatureFlagRes> GetAllFlags();

    FeatureFlagRes getFlag(String name);

    FeatureFlagRes updateFlagStatus(String name, boolean enabled);

    FeatureFlagRes updateFlagStrategy(String name, UpdateStrategyReq req);

    List<com.example.featureflagservice.dto.FeatureFlagAuditRes> getAuditLogs();

    boolean evaluateFlag(FeatureEvaluationRequest request);

    List<CustomerRes> getCustomers();

    CustomerRes createCustomer(CreateCustomerReq request);

    void deleteCustomer(String customerCode);

    List<CustomerFeatureFlagRes> getCustomerFeatureFlags(String customerCode);

    CustomerFeatureFlagRes updateCustomerFeatureFlag(String customerCode, String flagName, CustomerFeatureFlagReq request);

    Map<String, Object> applyToTrackingOrder();
}
