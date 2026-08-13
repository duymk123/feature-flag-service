package com.example.featureflagservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFeatureFlagRes {
    private String id;
    private String customerCode;
    private String customerName;
    private String ipAddress;
    private String flagName;
    private Boolean enabled;
    private String strategyId;
    private Map<String, String> strategyParams;
}
