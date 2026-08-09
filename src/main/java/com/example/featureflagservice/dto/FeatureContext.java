package com.example.featureflagservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureContext {
    private String username;
    private List<String> roles;
    private String clientIp;
    private String serverIp;
    private String host;
    private String requestTime;
    private List<String> springProfiles;
    private Map<String, String> systemProperties;
    private Map<String, String> headers;
    private Map<String, String> queryParameters;
    private Map<String, Object> attributes;
}
