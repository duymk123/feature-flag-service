package com.example.featureflagservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feature_flag_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureFlagAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flag_name", nullable = false)
    private String flagName;

    @Column(name = "action", nullable = false)
    private String action; // TOGGLE_ON, TOGGLE_OFF, UPDATE_STRATEGY

    @Column(name = "details", length = 1000)
    private String details;

    @Column(name = "performed_by", nullable = false)
    private String performedBy;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
