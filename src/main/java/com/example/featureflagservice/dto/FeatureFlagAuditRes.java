package com.example.featureflagservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FeatureFlagAuditRes {
    private Long id;
    private String flagName;
    private String action;
    private String details;
    private String performedBy;
    private LocalDateTime timestamp;
}
