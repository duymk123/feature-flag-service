package com.example.featureflagservice.service.impl;

import com.example.featureflagservice.dto.FeatureEvaluationRequest;
import com.example.featureflagservice.dto.FeatureFlagAuditRes;
import com.example.featureflagservice.dto.FeatureFlagRes;
import com.example.featureflagservice.dto.UpdateStrategyReq;
import com.example.featureflagservice.dto.CreateCustomerReq;
import com.example.featureflagservice.dto.CustomerFeatureFlagReq;
import com.example.featureflagservice.dto.CustomerFeatureFlagRes;
import com.example.featureflagservice.dto.CustomerRes;
import com.example.featureflagservice.entity.Customer;
import com.example.featureflagservice.entity.CustomerFeatureFlag;
import com.example.featureflagservice.entity.FeatureFlagAudit;
import com.example.featureflagservice.repository.CustomerFeatureFlagRepo;
import com.example.featureflagservice.repository.CustomerRepo;
import com.example.featureflagservice.repository.FeatureFlagAuditRepo;
import com.example.featureflagservice.repository.FeatureFlagRepo;
import com.example.featureflagservice.service.FeatureFlagService;
import com.example.featureflagservice.common.FeatureFlags;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.togglz.core.manager.FeatureManager;
import org.togglz.core.repository.FeatureState;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureFlagServiceImpl implements FeatureFlagService {
    private final FeatureManager featureManager;
    private final FeatureFlagRepo featureFlagRepo;
    private final FeatureFlagAuditRepo auditRepo;
    private final CustomerRepo customerRepo;
    private final CustomerFeatureFlagRepo customerFeatureFlagRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tracking-order.service.url:http://localhost:8080}")
    private String trackingOrderUrl;

    @Value("${tracking-order.sync-token:change-me}")
    private String trackingOrderSyncToken;

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
                for (String key : oldKeys) {
                    state.setParameter(key, null);
                }
                // Thêm tham số mới
                for (Map.Entry<String, String> entry : req.getParameters().entrySet()) {
                    state.setParameter(entry.getKey(), entry.getValue());
                }
            } else {
                // clear parameters if null passed
                java.util.List<String> oldKeys = new java.util.ArrayList<>(state.getParameterNames());
                for (String key : oldKeys) {
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

    @Override
    @Transactional(readOnly = true)
    public List<CustomerRes> getCustomers() {
        return customerRepo.findAll().stream()
                .map(this::toCustomerRes)
                .toList();
    }

    @Override
    @Transactional
    public CustomerRes createCustomer(CreateCustomerReq request) {
        Customer customer = customerRepo.findByCustomerCode(request.getCustomerCode())
                .orElseGet(Customer::new);
        customer.setCustomerCode(request.getCustomerCode());
        customer.setName(request.getName());
        customer.setIpAddress(request.getIpAddress());
        customer.setServiceUrl(request.getServiceUrl());
        return toCustomerRes(customerRepo.save(customer));
    }

    @Override
    @Transactional
    public CustomerRes updateCustomer(String customerCode, CreateCustomerReq request) {
        Customer customer = findCustomer(customerCode);
        // Do not update customerCode as it is the identifier
        customer.setName(request.getName());
        customer.setIpAddress(request.getIpAddress());
        customer.setServiceUrl(request.getServiceUrl());
        return toCustomerRes(customerRepo.save(customer));
    }

    @Override
    @Transactional
    public void deleteCustomer(String customerCode) {
        Customer customer = findCustomer(customerCode);
        customerFeatureFlagRepo.deleteAllByCustomer(customer);
        customerRepo.delete(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerFeatureFlagRes> getCustomerFeatureFlags(String customerCode) {
        Customer customer = findCustomer(customerCode);
        return customerFeatureFlagRepo.findByCustomer(customer).stream()
                .map(this::toCustomerFeatureFlagRes)
                .toList();
    }

    @Override
    @Transactional
    public CustomerFeatureFlagRes updateCustomerFeatureFlag(
            String customerCode,
            String flagName,
            CustomerFeatureFlagReq request
    ) {
        try {
            FeatureFlags.valueOf(flagName.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag not found: " + flagName);
        }
        Customer customer = findCustomer(customerCode);
        String normalizedFlagName = flagName.toUpperCase(Locale.ROOT);

        CustomerFeatureFlag customerFeatureFlag = customerFeatureFlagRepo
                .findByCustomerAndFlagName(customer, normalizedFlagName)
                .orElseGet(CustomerFeatureFlag::new);

        //update flag
        customerFeatureFlag.setCustomer(customer);
        customerFeatureFlag.setFlagName(normalizedFlagName);
        customerFeatureFlag.setEnabled(Boolean.TRUE.equals(request.getEnabled()));
        customerFeatureFlag.setStrategyId(request.getStrategyId());
        customerFeatureFlag.setStrategyParams(toJson(request.getStrategyParams()));

        return toCustomerFeatureFlagRes(customerFeatureFlagRepo.save(customerFeatureFlag));
    }

    @Override
    @Transactional
    // Bước 1: Lặp qua tất cả customer
    public Map<String, Object> applyToTrackingOrder() {
        // lấy toàn bộ danh sách từ customer từ db
        List<Customer> customers = customerRepo.findAll();
        Map<String, Object> result = new HashMap<>();

        // gọi apply cho từng customer
        for (Customer customer : customers) {
            try {
                // Tách biệt dữ liệu: đẩy cấu hình riêng biệt của từng customer sang instance tương ứng của họ
                Map<String, Object> res = applyToCustomer(customer.getCustomerCode());
                result.put(customer.getCustomerCode(), res);
            } catch (Exception e) {
                log.error("Faiculed to apply snapshot to stomer '{}'", customer.getCustomerCode(), e);
                result.put(customer.getCustomerCode(), Map.of(
                        "status", "FAILED",
                        "error", e.getMessage()
                ));
            }
        }
        return result;
    }

    @Override
    @Transactional
    // Bước 2: Lấy URL của đúng instance của customer đó
    public Map<String, Object> applyToCustomer(String customerCode) {
        // check customer hiện tại
        Customer customer = findCustomer(customerCode);

        // lấy ra url riêng của customer( http://tracking-order-b:8080)
        // → "http://tracking-order-a:8080" hoặc "http://tracking-order-b:8080"
        String targetUrl = customer.getServiceUrl();

        // check nếu Url null hoặc empty
        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            log.warn("Customer '{}' does not have a configured service URL, falling back to default.", customerCode);
            targetUrl = trackingOrderUrl;
        }
        log.info("Applying snapshot for customer '{}' to URL: {}", customerCode, targetUrl);
        return pushSnapshot(targetUrl, customerCode, customerCode);
    }



    /**
     * @param url           URL của tracking-order instance
     * @param label         Label để ghi vào audit log ("ALL" hoặc customerCode)
     * @param customerCode  Nếu != null, chỉ gửi flag overrides của customer này;
     *                      nếu null, gửi tất cả customers (dùng cho Apply global).
     */
    //helper:
    // Bước 3: Gửi HTTP POST đến đúng instance
    private Map<String, Object> pushSnapshot(String url, String label, String customerCode) {

        String version = Instant.now().toString();

        List<Map<String, Object>> features = Arrays.stream(FeatureFlags.values())
                .map(flag -> toSnapshotFeature(flag, version, customerCode))
                .toList();

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("version", version);
        snapshot.put("customerCode", customerCode);
        snapshot.put("features", features);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Token", trackingOrderSyncToken);

        //url: localhost: 8081, 8082
        String syncUrl = url + "/api/v1/feature-flags/sync";
        // POST http://tracking-order-a:8080/api/v1/feature-flags/sync
        //  hoặc POST http://tracking-order-b:8080/api/v1/feature-flags/sync

        ResponseEntity<Map> response = restTemplate.postForEntity(syncUrl, new HttpEntity<>(snapshot, headers), Map.class);

        // lưu tracking audit
        auditRepo.save(FeatureFlagAudit.builder()
                .flagName(label)
                .action("APPLY")
                .details("Applied snapshot version " + version + " to tracking-order [" + url + "]")
                .performedBy("admin")
                .timestamp(LocalDateTime.now())
                .build());

        Map<String, Object> body = response.getBody() == null ? Map.of() : response.getBody();
        return Map.of(
                "version", version,
                "trackingOrderStatus", response.getStatusCode().value(),
                "trackingOrderResponse", body
        );
    }



    /**
     * @param customerCode  Nếu != null, chỉ lấy overrides của customer này.
     *                      Toàn bộ instance tracking-order thuộc về customer đó,
     *                      nên global row sẽ phản ánh trạng thái của customer (không cần IP match).
     */
    //build context riêng cho customer
    private Map<String, Object> toSnapshotFeature(FeatureFlags flag, String version, String customerCode) {
        //lấy trạng thái hiện tại
        FeatureState state = featureManager.getFeatureState(flag);

        // Mặc định: lấy từ Togglz global state
        boolean effectiveEnabled = (state != null && state.isEnabled());

        String effectiveStrategyId = (state == null ? null : state.getStrategyId());

        Map<String, String> effectiveParams = new HashMap<>();

        if (state != null && state.getParameterNames() != null) {
            for (String key : state.getParameterNames()) {
                Object val = state.getParameter(key);
                if (val != null) {
                    effectiveParams.put(key, val.toString());
                }
            }
        }

        // Khi apply cho 1 customer cụ thể:
        List<Map<String, Object>> customerSnapshots = List.of();

        if (customerCode != null) {
            // Lấy cấu hình riêng của customer này
            var customerOverride = customerFeatureFlagRepo.findByFlagName(flag.name()).stream()
                    .filter(cf -> customerCode.equalsIgnoreCase(cf.getCustomer().getCustomerCode()))
                    .findFirst();

            if (customerOverride.isPresent()) {
                var override = customerOverride.get();
                // Thay thế hoàn toàn trạng thái global bằng trạng thái của customer
                effectiveEnabled = Boolean.TRUE.equals(override.getEnabled());
                effectiveStrategyId = override.getStrategyId(); // Có thể null
                effectiveParams = fromJson(override.getStrategyParams());
            }
            // QUAN TRỌNG: Trả về customerSnapshots rỗng (List.of()) 
            // -> DB tracking-order sẽ lưu client_ip = NULL và customer_code = NULL
            // -> Bất kỳ IP nào (kể cả Postman 172.x.x.x) gọi vào instance này đều nhận được trạng thái của customer này.
        } else {
            // Apply Global: giữ nguyên logic cũ, gửi IP của tất cả customers
            var allCustomerFlags = customerFeatureFlagRepo.findByFlagName(flag.name());
            customerSnapshots = allCustomerFlags.stream()
                    .map(customerFeatureFlag -> {
                        Customer customer = customerFeatureFlag.getCustomer();
                        Map<String, Object> customerSnapshot = new HashMap<>();
                        customerSnapshot.put("customerCode", customer.getCustomerCode());
                        customerSnapshot.put("ipAddress", customer.getIpAddress());
                        customerSnapshot.put("enabled", Boolean.TRUE.equals(customerFeatureFlag.getEnabled()));
                        customerSnapshot.put("strategyId", customerFeatureFlag.getStrategyId());
                        customerSnapshot.put("strategyParams", fromJson(customerFeatureFlag.getStrategyParams()));
                        return customerSnapshot;
                    })
                    .toList();
        }

        Map<String, Object> featureSnapshot = new HashMap<>();
        featureSnapshot.put("flagName", flag.name());
        featureSnapshot.put("enabled", effectiveEnabled);
        featureSnapshot.put("strategyId", effectiveStrategyId);
        featureSnapshot.put("strategyParams", effectiveParams);
        featureSnapshot.put("customers", customerSnapshots);
        featureSnapshot.put("version", version);
        return featureSnapshot;
    }

    private Customer findCustomer(String customerCode) {
        return customerRepo.findByCustomerCode(customerCode)
                .orElseThrow(()
                        -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found: " + customerCode));
    }

    private CustomerRes toCustomerRes(Customer customer) {
        return CustomerRes.builder()
                .id(customer.getId())
                .customerCode(customer.getCustomerCode())
                .name(customer.getName())
                .ipAddress(customer.getIpAddress())
                .serviceUrl(customer.getServiceUrl())
                .build();
    }

    private CustomerFeatureFlagRes toCustomerFeatureFlagRes(CustomerFeatureFlag customerFeatureFlag) {
        Customer customer = customerFeatureFlag.getCustomer();
        return CustomerFeatureFlagRes.builder()
                .id(customerFeatureFlag.getId())
                .customerCode(customer.getCustomerCode())
                .customerName(customer.getName())
                .ipAddress(customer.getIpAddress())
                .flagName(customerFeatureFlag.getFlagName())
                .enabled(customerFeatureFlag.getEnabled())
                .strategyId(customerFeatureFlag.getStrategyId())
                .strategyParams(fromJson(customerFeatureFlag.getStrategyParams()))
                .build();
    }

    private String toJson(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            log.warn("Cannot serialize customer feature strategy params", e);
            return null;
        }
    }

    private Map<String, String> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {
            });
        } catch (JsonProcessingException e) {
            log.warn("Cannot parse customer feature strategy params", e);
            return Map.of();
        }
    }
}
