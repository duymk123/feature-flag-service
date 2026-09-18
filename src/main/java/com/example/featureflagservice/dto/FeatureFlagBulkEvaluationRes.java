package com.example.featureflagservice.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FeatureFlagBulkEvaluationRes {
    private LocalDateTime generatedAt;

    //Context đã dùng để evaluate (username, roles, IP, ...)
    private FeatureContext context;


     // Map: flagName → enabled (true/false)
     // Ví dụ: { "BUY_NOW": true, "TRACK_ORDER": false, "PAYMENT_VNPAY": true }
    private Map<String, Boolean> features;
}
