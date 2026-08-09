package com.example.featureflagservice.service;

import com.example.featureflagservice.dto.FeatureEvaluationRequest;
import com.example.featureflagservice.dto.FeatureFlagRes;
import com.example.featureflagservice.dto.UpdateStrategyReq;

import java.util.List;

public interface FeatureFlagService {
    List<FeatureFlagRes> GetAllFlags();

    FeatureFlagRes getFlag(String name);

    FeatureFlagRes updateFlagStatus(String name, boolean enabled);

    FeatureFlagRes updateFlagStrategy(String name, UpdateStrategyReq req);

    List<com.example.featureflagservice.dto.FeatureFlagAuditRes> getAuditLogs();

    boolean evaluateFlag(FeatureEvaluationRequest request);
}
