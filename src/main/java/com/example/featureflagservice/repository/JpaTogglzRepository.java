package com.example.featureflagservice.repository;

import com.example.featureflagservice.entity.FeatureFlag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.togglz.core.Feature;
import org.togglz.core.repository.FeatureState;
import org.togglz.core.repository.StateRepository;

/**
 * Togglz StateRepository dùng JPA.
 * Chỉ quản lý trạng thái ON/OFF qua Togglz.
 * Strategies được quản lý riêng qua entity FeatureFlag.strategies (JSON array),
 * không qua Togglz FeatureState.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class JpaTogglzRepository implements StateRepository {

    private final FeatureFlagRepo featureFlagRepo;

    @Override
    public FeatureState getFeatureState(Feature feature) {
        // Tìm kiếm cờ trong Database
        return featureFlagRepo.findByName(feature.name()).map(entity -> {

            // Khởi tạo trạng thái (Bật/Tắt) — Togglz chỉ quản lý on/off
            FeatureState state = new FeatureState(feature, entity.getEnabled());

            // Strategies được quản lý riêng qua entity, không qua Togglz FeatureState
            // → Không set strategyId hay parameters lên FeatureState nữa

            return state;

        }).orElse(null); // Trả về null nếu chưa có trong DB (Togglz sẽ coi như tắt)
    }

    @Override
    public void setFeatureState(FeatureState featureState) {
        // Tìm cờ trong DB, nếu chưa có thì tạo mới
        FeatureFlag entity = featureFlagRepo.findByName(featureState.getFeature().name())
                .orElse(new FeatureFlag(featureState.getFeature().name()));

        // Chỉ cập nhật trạng thái ON/OFF
        entity.setEnabled(featureState.isEnabled());

        // Strategies KHÔNG được quản lý qua Togglz nữa
        // → Không đọc/ghi strategyId hay parameters từ FeatureState

        // Lưu vào DB (JPA Auditing sẽ tự động cập nhật created_at, updated_by...)
        featureFlagRepo.save(entity);
    }
}
