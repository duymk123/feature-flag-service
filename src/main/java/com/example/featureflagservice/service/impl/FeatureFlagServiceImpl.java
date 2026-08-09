package com.example.featureflagservice.service.impl;

import com.example.featureflagservice.dto.FeatureEvaluationRequest;
import com.example.featureflagservice.dto.FeatureFlagAuditRes;
import com.example.featureflagservice.dto.FeatureFlagRes;
import com.example.featureflagservice.dto.UpdateStrategyReq;
import com.example.featureflagservice.entity.FeatureFlagAudit;
import com.example.featureflagservice.repository.FeatureFlagAuditRepo;
import com.example.featureflagservice.repository.FeatureFlagRepo;
import com.example.featureflagservice.service.FeatureFlagService;
import com.example.featureflagservice.common.FeatureFlags;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.togglz.core.manager.FeatureManager;
import org.togglz.core.repository.FeatureState;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureFlagServiceImpl implements FeatureFlagService {
    private final FeatureManager featureManager;
    private final FeatureFlagRepo featureFlagRepo;
    private final FeatureFlagAuditRepo auditRepo;

    @Override
    public List<FeatureFlagAuditRes> getAuditLogs() {
        return auditRepo.findAllByOrderByTimestampDesc().stream()
            .map(audit -> FeatureFlagAuditRes.builder()
                .id(audit.getId())
                .flagName(audit.getFlagName())
                .action(audit.getAction())
                .details(audit.getDetails())
                .performedBy(audit.getPerformedBy())
                .timestamp(audit.getTimestamp())
                .build())
            .toList();
    }

    @Override
    public List<FeatureFlagRes> GetAllFlags() {
        return Arrays.stream(FeatureFlags.values())
                .map(this::toRes)
                .collect(Collectors.toList());
    }

    @Override
    public FeatureFlagRes getFlag(String name) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase());
            return toRes(flag);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag không tồn tại: " + name);
        }
    }

    @Override
    public FeatureFlagRes updateFlagStatus(String name, boolean enabled) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase());
            FeatureState state = featureManager.getFeatureState(flag);
            
            boolean oldStatus = state.isEnabled();
            
            state.setEnabled(enabled);
            featureManager.setFeatureState(state);
            
            // Lịch sử (Audit Log)
            if (oldStatus != enabled) {
                auditRepo.save(FeatureFlagAudit.builder()
                        .flagName(flag.name())
                        .action(enabled ? "TOGGLE_ON" : "TOGGLE_OFF")
                        .details(String.format("Changed from %s to %s", oldStatus ? "ON" : "OFF", enabled ? "ON" : "OFF"))
                        .performedBy("admin")
                        .timestamp(LocalDateTime.now())
                        .build());
            }

            return toRes(flag);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag không tồn tại: " + name);
        }
    }

    @Override
    public FeatureFlagRes updateFlagStrategy(String name, UpdateStrategyReq req) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase());
            FeatureState state = featureManager.getFeatureState(flag);
            
            String oldStrategy = state.getStrategyId();
            
            state.setStrategyId(req.getStrategyId());
            if (req.getParameters() != null) {
                // Xoá tham số cũ
                java.util.List<String> oldKeys = new java.util.ArrayList<>(state.getParameterNames());
                for(String key : oldKeys) {
                    state.setParameter(key, null);
                }
                // Thêm tham số mới
                for (Map.Entry<String, String> entry : req.getParameters().entrySet()) {
                    state.setParameter(entry.getKey(), entry.getValue());
                }
            } else {
                // clear parameters if null passed
                java.util.List<String> oldKeys = new java.util.ArrayList<>(state.getParameterNames());
                for(String key : oldKeys) {
                    state.setParameter(key, null);
                }
            }
            featureManager.setFeatureState(state);
            
            // Lịch sử (Audit Log)
            String newStrategy = req.getStrategyId() != null ? req.getStrategyId() : "None";
            String oldStrategyStr = oldStrategy != null ? oldStrategy : "None";
            
            auditRepo.save(FeatureFlagAudit.builder()
                    .flagName(flag.name())
                    .action("UPDATE_STRATEGY")
                    .details(String.format("Strategy changed from '%s' to '%s'", oldStrategyStr, newStrategy))
                    .performedBy("admin")
                    .timestamp(LocalDateTime.now())
                    .build());
                    
            return toRes(flag);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag không tồn tại: " + name);
        }
    }

    private FeatureFlagRes toRes(FeatureFlags flag) {
        FeatureState state = featureManager.getFeatureState(flag);
        Map<String, String> parameters = new HashMap<>();
        if (state.getParameterNames() != null) {
            for (String key : state.getParameterNames()) {
                parameters.put(key, state.getParameter(key));
            }
        }
        
        LocalDateTime updatedAt = featureFlagRepo.findByName(flag.name())
                .map(entity -> entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt())
                .orElse(null);

        return FeatureFlagRes.builder()
                .name(flag.name())
                .enabled(state.isEnabled())
                .description(flag.name()) 
                .updatedAt(updatedAt)
                .strategyId(state.getStrategyId())
                .parameters(parameters)
                .build();
    }

    @Override
    public boolean evaluateFlag(FeatureEvaluationRequest request) {
        com.example.featureflagservice.adapter.FeatureContextHolder.setContext(request.getContext());
        log.info("Feature: {}", request.getFeature());
        log.info("Context: {}", request.getContext());
        try {
            FeatureFlags flag = FeatureFlags.valueOf(request.getFeature().toUpperCase());
            return flag.isActive();
        } finally {
            com.example.featureflagservice.adapter.FeatureContextHolder.clear();
        }
    }
}
