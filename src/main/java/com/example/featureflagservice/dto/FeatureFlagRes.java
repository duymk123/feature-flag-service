package com.example.featureflagservice.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Response trả về khi query 1 flag.
 * Đây là contract API mà tracking-order sẽ dùng để đọc.
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FeatureFlagRes {
    private String id;
    private String name;
    private boolean enabled;
    private String description;
    private LocalDateTime updatedAt;
    private String strategyId;
    private java.util.Map<String, String> parameters;
}
