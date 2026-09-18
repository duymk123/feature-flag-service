package com.example.featureflagservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "feature_flags")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Builder
public class FeatureFlag {

    @Id
    @UuidGenerator
    private String id;

    @Column(name = "name", unique = true, nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    // lưu xuống db theo dạng json
    //[{"strategyId":"user-role","params":{"roles":"ROLE_BUYER"}},
    // {"strategyId":"username","params":{"users":"duymk123"}}]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "strategies", columnDefinition = "json")
    private String strategies;

    @Builder.Default
    @Column(name = "strategy_logic", nullable = false, length = 3)
    private String strategyLogic = "OR";

    @Builder.Default
    @Column(name = "is_granted", nullable = false)
    private boolean isGranted = false;

 // BaseEntity
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @PrePersist
    public void prePersist() {
        if (this.strategyLogic == null || this.strategyLogic.isBlank()) {
            this.strategyLogic = "OR";
        }
    }

    public FeatureFlag(String name) {
        this.name = name;
        this.enabled = false;
        this.isGranted = false;
        this.strategyLogic = "OR";
        this.deleted = false;
    }
}
