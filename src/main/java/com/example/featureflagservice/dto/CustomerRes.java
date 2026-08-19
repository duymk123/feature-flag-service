package com.example.featureflagservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRes {
    private String id;
    private String customerCode;
    private String name;
    private String ipAddress;
    private String serviceUrl;
}
