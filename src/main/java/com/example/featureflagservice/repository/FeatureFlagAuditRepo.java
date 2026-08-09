package com.example.featureflagservice.repository;

import com.example.featureflagservice.entity.FeatureFlagAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeatureFlagAuditRepo extends JpaRepository<FeatureFlagAudit, Long> {
    List<FeatureFlagAudit> findAllByOrderByTimestampDesc();
}
