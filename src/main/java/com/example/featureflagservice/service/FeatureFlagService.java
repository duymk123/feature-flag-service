package com.example.featureflagservice.service;

import com.example.featureflagservice.dto.*;

import java.util.List;
import java.util.Map;

public interface FeatureFlagService {

    List<StrategyOptionRes> getStrategyOptions(String strategyType);

    List<FeatureFlagRes> GetAllFlags();

    FeatureFlagRes getFlag(String name);

    FeatureFlagRes updateFlagStatus(String name, boolean enabled);

    FeatureFlagRes updateFlagGrant(String name, boolean isGranted);

    FeatureFlagRes updateFlagStrategy(String name, UpdateStrategyReq req);

    List<FeatureFlagAuditRes> getAuditLogs();

    boolean evaluateFlag(FeatureEvaluationRequest request);

    FeatureFlagBulkEvaluationRes evaluateAllFlags(FeatureEvaluationRequest request);

    Map<String, Object> applyToTrackingOrder();
}


