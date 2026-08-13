package com.example.featureflagservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFeatureFlagReq {
    private Boolean enabled;
    private String strategyId;
    private Map<String, String> strategyParams;
}
