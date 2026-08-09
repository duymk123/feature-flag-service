package com.example.featureflagservice.repository;

import com.example.featureflagservice.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeatureFlagRepo extends JpaRepository<FeatureFlag, String> {

//     Tìm flag theo tên (case-sensitive). Ví dụ: findByName("BUY_NOW")

    Optional<FeatureFlag> findByName(String name);

//     Kiểm tra flag có tồn tại không trước khi tạo mới
    boolean existsByName(String name);
}
