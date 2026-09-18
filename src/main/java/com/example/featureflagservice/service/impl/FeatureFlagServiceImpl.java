package com.example.featureflagservice.service.impl;

import com.example.featureflagservice.common.FeatureFlags;
import com.example.featureflagservice.dto.*;
import com.example.featureflagservice.entity.FeatureFlag;
import com.example.featureflagservice.entity.FeatureFlagAudit;
import com.example.featureflagservice.repository.FeatureFlagAuditRepo;
import com.example.featureflagservice.repository.FeatureFlagRepo;
import com.example.featureflagservice.service.FeatureFlagService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.togglz.core.manager.FeatureManager;
import org.togglz.core.repository.FeatureState;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureFlagServiceImpl implements FeatureFlagService {

    private static final Map<String, String> STRATEGY_PARAM_KEYS = Map.of(
            "user-role", "roles",
            "user_role", "roles",
            "username", "users",
            "users_by_name", "users",
            "remote-client-ip", "ips",
            "ip_whitelist", "ips",
            "remote-server-name", "serverNames",
            "remote-spring-profile", "profiles"
    );

    private final FeatureManager featureManager;
    private final FeatureFlagRepo featureFlagRepo;
    private final FeatureFlagAuditRepo auditRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tracking-order.service.url:http://localhost:8080}")
    private String trackingOrderUrl;

    @Value("${tracking-order.sync-token:change-me}")
    private String trackingOrderSyncToken;

    @Override
    public List<StrategyOptionRes> getStrategyOptions(String strategyType) {
        String paramKey = STRATEGY_PARAM_KEYS.get(strategyType);
        if (paramKey == null) {
            return List.of();
        }

        boolean isUserStrategy = "username".equals(strategyType) || "users_by_name".equals(strategyType);
        boolean isRoleStrategy = "user-role".equals(strategyType) || "user_role".equals(strategyType);

        if (isUserStrategy || isRoleStrategy) {
            String endpoint = isUserStrategy
                    ? "/api/v1/feature-flags/users"
                    : "/api/v1/feature-flags/roles";

            String apiUrl = trackingOrderUrl + endpoint;
            log.info("Fetching {} from local tracking-order: {}", strategyType, apiUrl);

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("X-Internal-Token", trackingOrderSyncToken);
                ResponseEntity<List> response = restTemplate.exchange(
                        apiUrl,
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        List.class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<?> rawValues = response.getBody();
                    return rawValues.stream()
                            .filter(Objects::nonNull)
                            .map(Object::toString)
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .distinct()
                            .map(v -> StrategyOptionRes.builder()
                                    .id(v)
                                    .strategyType(strategyType)
                                    .value(v)
                                    .label(v)
                                    .build())
                            .toList();
                }
            } catch (Exception e) {
                log.warn("Cannot fetch {} from {}: {}", strategyType, apiUrl, e.getMessage());
            }
        }
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeatureFlagAuditRes> getAuditLogs() {
        return auditRepo.findAllByOrderByTimestampDesc().stream()
                .map(audit -> FeatureFlagAuditRes.builder()
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
        return featureFlagRepo.findByDeletedFalseAndIsGrantedTrue().stream()
                .map(this::entityToRes)
                .collect(Collectors.toList());
    }

    @Override
    public FeatureFlagRes getFlag(String name) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase(Locale.ROOT));
            FeatureFlag entity = featureFlagRepo.findByName(flag.name())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag chưa được cấp phép: " + name));
            if (!entity.isGranted() || entity.isDeleted()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag chưa được cấp phép: " + name);
            }
            return toRes(flag);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag không tồn tại: " + name);
        }
    }

    private String getDefaultDescription(FeatureFlags flag) {
        switch (flag) {
            case BUY_NOW:
                return "Cho phép hiển thị nút Mua Ngay và đặt hàng nhanh không cần qua giỏ hàng";
            case ORDER_DETAIL:
                return "Cho phép xem thông tin lịch sử và hành trình chi tiết của đơn hàng";
            case PRICE_INCREASE:
                return "Tính năng điều chỉnh giá sản phẩm tự động theo chiến dịch";
            default:
                return flag.name();
        }
    }

    @Override
    @Transactional
    public FeatureFlagRes updateFlagGrant(String name, boolean isGranted) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase(Locale.ROOT));

            FeatureFlag entity = featureFlagRepo.findByName(flag.name())
                    .orElseGet(() -> new FeatureFlag(flag.name()));

            boolean oldGranted = entity.isGranted();
            entity.setGranted(isGranted);
            if (entity.getStrategyLogic() == null || entity.getStrategyLogic().isBlank()) {
                entity.setStrategyLogic("OR");
            }
            if (entity.getDescription() == null || entity.getDescription().isBlank()) {
                entity.setDescription(getDefaultDescription(flag));
            }

            // Khi thu hồi quyền: tắt cờ
            if (!isGranted) {
                entity.setEnabled(false);
                FeatureState state = featureManager.getFeatureState(flag);
                if (state != null) {
                    state.setEnabled(false);
                    featureManager.setFeatureState(state);
                }
            } else {
                // Khi cấp quyền: nếu enabled chưa được thiết lập thì mặc định là false (Seller sẽ chủ động bật)
                if (entity.getEnabled() == null) {
                    entity.setEnabled(false);
                }
                FeatureState state = featureManager.getFeatureState(flag);
                if (state == null) {
                    featureManager.setFeatureState(new FeatureState(flag, entity.getEnabled()));
                }
            }

            featureFlagRepo.save(entity);

            if (oldGranted != isGranted) {
                auditRepo.save(FeatureFlagAudit.builder()
                        .flagName(flag.name())
                        .action(isGranted ? "GRANT" : "REVOKE")
                        .details(String.format("Super Admin %s feature permission", isGranted ? "GRANTED" : "REVOKED"))
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
    @Transactional
    public FeatureFlagRes updateFlagStatus(String name, boolean enabled) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase(Locale.ROOT));

            FeatureFlag entity = featureFlagRepo.findByName(flag.name())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag không tồn tại: " + name));

            if (!entity.isGranted() || entity.isDeleted()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tính năng này chưa được Super Admin cấp phép cho Seller");
            }

            FeatureState state = featureManager.getFeatureState(flag);
            boolean oldStatus = (state != null && state.isEnabled());

            if (state == null) {
                state = new FeatureState(flag, enabled);
            } else {
                state.setEnabled(enabled);
            }
            featureManager.setFeatureState(state);

            // Cập nhật entity
            entity.setEnabled(enabled);
            if (entity.getStrategyLogic() == null || entity.getStrategyLogic().isBlank()) {
                entity.setStrategyLogic("OR");
            }
            featureFlagRepo.save(entity);

            // Ghi Audit Log
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
    @Transactional
    public FeatureFlagRes updateFlagStrategy(String name, UpdateStrategyReq req) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(name.toUpperCase(Locale.ROOT));

            FeatureFlag entity = featureFlagRepo.findByName(flag.name())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag không tồn tại: " + name));

            if (!entity.isGranted() || entity.isDeleted()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tính năng này chưa được Super Admin cấp phép cho Seller");
            }

            String oldStrategies = entity.getStrategies();

            entity.setStrategies(strategiesToJson(req.getStrategies()));
            entity.setStrategyLogic("AND".equalsIgnoreCase(req.getStrategyLogic()) ? "AND" : "OR");
            featureFlagRepo.save(entity);

            int newCount = req.getStrategies() != null ? req.getStrategies().size() : 0;
            int oldCount = strategiesFromJson(oldStrategies).size();

            auditRepo.save(FeatureFlagAudit.builder()
                    .flagName(flag.name())
                    .action("UPDATE_STRATEGY")
                    .details(String.format("Strategies changed from %d to %d rules", oldCount, newCount))
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

        var entityOpt = featureFlagRepo.findByName(flag.name());

        List<StrategyItem> strategies = entityOpt
                .map(entity -> strategiesFromJson(entity.getStrategies()))
                .orElse(List.of());

        String strategyLogic = entityOpt
                .map(entity -> entity.getStrategyLogic() != null ? entity.getStrategyLogic() : "OR")
                .orElse("OR");

        LocalDateTime updatedAt = entityOpt
                .map(entity -> entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt())
                .orElse(null);

        String desc = entityOpt.map(FeatureFlag::getDescription).filter(d -> d != null && !d.isBlank())
                .orElse(getDefaultDescription(flag));

        return FeatureFlagRes.builder()
                .id(entityOpt.map(FeatureFlag::getId).orElse(null))
                .name(flag.name())
                .enabled(state != null && state.isEnabled())
                .description(desc)
                .updatedAt(updatedAt)
                .strategies(strategies)
                .strategyLogic(strategyLogic)
                .build();
    }

    private FeatureFlagRes entityToRes(FeatureFlag entity) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(entity.getName().toUpperCase(Locale.ROOT));
            return toRes(flag);
        } catch (Exception e) {
            return FeatureFlagRes.builder()
                    .name(entity.getName())
                    .enabled(Boolean.TRUE.equals(entity.getEnabled()))
                    .description(entity.getDescription() != null ? entity.getDescription() : entity.getName())
                    .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt())
                    .strategies(strategiesFromJson(entity.getStrategies()))
                    .strategyLogic(entity.getStrategyLogic() != null ? entity.getStrategyLogic() : "OR")
                    .build();
        }
    }

    @Override
    public boolean evaluateFlag(FeatureEvaluationRequest request) {
        try {
            FeatureFlags flag = FeatureFlags.valueOf(request.getFeature().toUpperCase(Locale.ROOT));
            FeatureFlag entity = featureFlagRepo.findByName(flag.name()).orElse(null);
            if (entity == null || !entity.isGranted() || !Boolean.TRUE.equals(entity.getEnabled())) {
                return false;
            }

            List<StrategyItem> strategies = strategiesFromJson(entity.getStrategies());
            if (strategies.isEmpty()) {
                return true;
            }

            String logic = entity.getStrategyLogic() != null ? entity.getStrategyLogic() : "OR";
            FeatureContext ctx = request.getContext();

            if ("AND".equalsIgnoreCase(logic)) {
                for (StrategyItem s : strategies) {
                    if (!isStrategyActive(s, ctx)) {
                        return false;
                    }
                }
                return true;
            } else {
                for (StrategyItem s : strategies) {
                    if (isStrategyActive(s, ctx)) {
                        return true;
                    }
                }
                return false;
            }
        } catch (IllegalArgumentException e) {
            log.warn("Flag not found during evaluation: {}", request.getFeature());
            return false;
        }
    }

    @Override
    public FeatureFlagBulkEvaluationRes evaluateAllFlags(FeatureEvaluationRequest request) {
        Map<String, Boolean> features = new HashMap<>();
        // CHỈ evaluate và response những cờ mà Super Admin đã CẤP PHÉP (isGranted = true)
        List<FeatureFlag> grantedFlags = featureFlagRepo.findByDeletedFalseAndIsGrantedTrue();
        for (FeatureFlag entity : grantedFlags) {
            FeatureEvaluationRequest singleReq = new FeatureEvaluationRequest();
            singleReq.setFeature(entity.getName());
            singleReq.setContext(request.getContext());
            features.put(entity.getName(), evaluateFlag(singleReq));
        }

        return FeatureFlagBulkEvaluationRes.builder()
                .generatedAt(LocalDateTime.now())
                .context(request.getContext())
                .features(features)
                .build();
    }

    private boolean isStrategyActive(StrategyItem item, FeatureContext ctx) {
        if (item == null || item.getStrategyId() == null) {
            return false;
        }
        Map<String, String> params = item.getParams() != null ? item.getParams() : Map.of();

        switch (item.getStrategyId().toLowerCase(Locale.ROOT)) {
            case "username":
            case "users_by_name": {
                String users = params.get("users");
                if (users == null || users.isBlank() || ctx == null || ctx.getUsername() == null) {
                    return false;
                }
                List<String> list = Arrays.asList(users.split("[,\\s]+"));
                return list.contains(ctx.getUsername());
            }
            case "user-role":
            case "user_role":
            case "role": {
                String roles = params.get("roles");
                if (roles == null || roles.isBlank() || ctx == null || ctx.getRoles() == null) {
                    return false;
                }
                List<String> list = Arrays.asList(roles.split("[,\\s]+"));
                return ctx.getRoles().stream().anyMatch(list::contains);
            }
            case "release-date":
            case "release_date": {
                String dateStr = params.get("date");
                if (dateStr == null || dateStr.isBlank()) {
                    return false;
                }
                try {
                    java.time.LocalDate releaseDate = java.time.LocalDate.parse(dateStr.trim());
                    java.time.LocalDate evalDate = java.time.LocalDate.now();
                    if (ctx != null && ctx.getRequestTime() != null && !ctx.getRequestTime().isBlank()) {
                        try {
                            evalDate = java.time.LocalDate.parse(ctx.getRequestTime().trim().substring(0, 10));
                        } catch (Exception ignored) {
                        }
                    }
                    return evalDate.isEqual(releaseDate) || evalDate.isAfter(releaseDate);
                } catch (Exception e) {
                    log.warn("Invalid date format for release-date strategy: '{}'. Expected YYYY-MM-DD", dateStr, e);
                    return false;
                }
            }
            case "remote-client-ip":
            case "ip_whitelist":
            case "ip": {
                String ips = params.get("ips");
                if (ips == null || ips.isBlank() || ctx == null || ctx.getClientIp() == null) {
                    return false;
                }
                List<String> list = Arrays.asList(ips.split("[,\\s]+"));
                return list.contains(ctx.getClientIp());
            }
            case "remote-server-name": {
                String servers = params.get("serverNames");
                if (servers == null || servers.isBlank() || ctx == null || ctx.getHost() == null) {
                    return false;
                }
                List<String> list = Arrays.asList(servers.split("[,\\s]+"));
                return list.contains(ctx.getHost());
            }
            case "remote-spring-profile": {
                String profiles = params.get("profiles");
                if (profiles == null || profiles.isBlank() || ctx == null || ctx.getSpringProfiles() == null) {
                    return false;
                }
                List<String> list = Arrays.asList(profiles.split("[,\\s]+"));
                return ctx.getSpringProfiles().stream().anyMatch(list::contains);
            }
            case "gradual-rollout":
            case "gradual_rollout":
            case "gradual_rollout_user_id":
            case "rollout": {
                String pctStr = params.get("percentage");
                if (pctStr == null || pctStr.isBlank()) return false;
                try {
                    int pct = Integer.parseInt(pctStr.trim());
                    if (pct <= 0) return false;
                    if (pct >= 100) return true;
                    String id = (ctx != null && ctx.getUsername() != null) ? ctx.getUsername() : (ctx != null ? ctx.getClientIp() : null);
                    if (id == null) return false;
                    return Math.abs(id.hashCode() % 100) < pct;
                } catch (Exception e) {
                    return false;
                }
            }
            case "remote-system-property": {
                String prop = params.get("property");
                String val = params.get("value");
                if (prop == null || ctx == null || ctx.getSystemProperties() == null) return false;
                String actualVal = ctx.getSystemProperties().get(prop);
                return val != null && val.equals(actualVal);
            }
            default:
                log.warn("Unknown strategy: {}", item.getStrategyId());
                return false;
        }
    }

    @Override
    @Transactional
    public Map<String, Object> applyToTrackingOrder() {
        log.info("Applying snapshot to local tracking order at: {}", trackingOrderUrl);
        return pushSnapshot(trackingOrderUrl, "ALL");
    }

    private Map<String, Object> pushSnapshot(String url, String label) {
        String version = Instant.now().toString();

        // CHỈ đẩy snapshot các cờ mà Super Admin đã CẤP PHÉP (isGranted = true) sang Tracking-Order
        List<Map<String, Object>> features = featureFlagRepo.findByDeletedFalseAndIsGrantedTrue().stream()
                .map(entity -> toSnapshotFeature(entity, version))
                .toList();

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("version", version);
        snapshot.put("features", features);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Token", trackingOrderSyncToken);

        String syncUrl = url + "/api/v1/feature-flags/sync";

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(syncUrl, new HttpEntity<>(snapshot, headers), Map.class);

            auditRepo.save(FeatureFlagAudit.builder()
                    .flagName(label)
                    .action("APPLY")
                    .details("Applied snapshot version " + version + " to tracking-order [" + url + "]")
                    .performedBy("admin")
                    .timestamp(LocalDateTime.now())
                    .build());

            Map<String, Object> body = response.getBody() == null ? Map.of() : response.getBody();
            return Map.of(
                    "status", "SUCCESS",
                    "version", version,
                    "trackingOrderStatus", response.getStatusCode().value(),
                    "trackingOrderResponse", body
            );
        } catch (Exception e) {
            log.error("Failed to push snapshot to tracking-order ({}): {}", syncUrl, e.getMessage());
            return Map.of(
                    "status", "FAILED",
                    "error", e.getMessage()
            );
        }
    }

    private Map<String, Object> toSnapshotFeature(FeatureFlag entity, String version) {
        boolean effectiveEnabled = Boolean.TRUE.equals(entity.getEnabled());
        try {
            FeatureFlags flag = FeatureFlags.valueOf(entity.getName().toUpperCase(Locale.ROOT));
            FeatureState state = featureManager.getFeatureState(flag);
            if (state != null) {
                effectiveEnabled = state.isEnabled();
            }
        } catch (Exception ignored) {}

        List<StrategyItem> effectiveStrategies = strategiesFromJson(entity.getStrategies());
        String effectiveStrategyLogic = entity.getStrategyLogic() != null ? entity.getStrategyLogic() : "OR";

        List<Map<String, Object>> strategiesForSnapshot = effectiveStrategies.stream()
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("strategyId", s.getStrategyId());
                    map.put("params", s.getParams() != null ? s.getParams() : Map.of());
                    return map;
                })
                .toList();

        Map<String, Object> featureSnapshot = new HashMap<>();
        featureSnapshot.put("flagName", entity.getName());
        featureSnapshot.put("enabled", effectiveEnabled);
        featureSnapshot.put("strategies", strategiesForSnapshot);
        featureSnapshot.put("strategyLogic", effectiveStrategyLogic);
        featureSnapshot.put("customers", List.of());
        featureSnapshot.put("version", version);
        return featureSnapshot;
    }

    private String strategiesToJson(List<StrategyItem> strategies) {
        if (strategies == null || strategies.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(strategies);
        } catch (JsonProcessingException e) {
            log.warn("Cannot serialize strategies to JSON", e);
            return null;
        }
    }

    private List<StrategyItem> strategiesFromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<StrategyItem>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Cannot parse strategies JSON: {}", json, e);
            return List.of();
        }
    }
}
