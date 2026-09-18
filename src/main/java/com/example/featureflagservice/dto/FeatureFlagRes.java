package com.example.featureflagservice.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

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

    // -> gom hết vào thành 1 strategies -> lưu dưới dạng json
    private List<StrategyItem> strategies;
    private String strategyLogic;
}
