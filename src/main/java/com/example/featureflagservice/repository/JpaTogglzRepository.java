package com.example.featureflagservice.repository;

import com.example.featureflagservice.entity.FeatureFlag;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.togglz.core.Feature;
import org.togglz.core.repository.FeatureState;
import org.togglz.core.repository.StateRepository;

import java.util.Map;

@Repository
@RequiredArgsConstructor
@Slf4j
public class JpaTogglzRepository implements StateRepository {

    private final FeatureFlagRepo featureFlagRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public FeatureState getFeatureState(Feature feature) {
        // Tìm kiếm cờ trong Database
        return featureFlagRepo.findByName(feature.name()).map(entity -> {

            // Khởi tạo trạng thái (Bật/Tắt)
            FeatureState state = new FeatureState(feature, entity.getEnabled());

            // Gán tên Thuật toán (nếu có)
            if (entity.getStrategyId() != null) {
                state.setStrategyId(entity.getStrategyId());
            }

            // Gán tham số Thuật toán (Đọc từ JSON String sang Map)
            if (entity.getStrategyParams() != null && !entity.getStrategyParams().isBlank()) {
                try {
                    Map<String, String> params = objectMapper.readValue(
                            entity.getStrategyParams(),
                            new TypeReference<Map<String, String>>() {
                            }
                    );
                    for (Map.Entry<String, String> entry : params.entrySet()) {
                        state.setParameter(entry.getKey(), entry.getValue());
                    }
                } catch (JsonProcessingException e) {
                    log.error("Lỗi khi parse strategy params JSON của cờ {}", feature.name(), e);
                }
            }

            return state;

        }).orElse(null); // Trả về null nếu chưa có trong DB (Togglz sẽ coi như tắt)
    }

    @Override
    public void setFeatureState(FeatureState featureState) {
        // Tìm cờ trong DB, nếu chưa có thì tạo mới
        FeatureFlag entity = featureFlagRepo.findByName(featureState.getFeature().name())
                .orElse(new FeatureFlag(featureState.getFeature().name()));

        // Cập nhật trạng thái
        entity.setEnabled(featureState.isEnabled());
        entity.setStrategyId(featureState.getStrategyId());

        // Chuyển Map tham số thành JSON String để lưu vào DB
        Map<String, String> paramsMap = featureState.getParameterMap();
        if (paramsMap != null && !paramsMap.isEmpty()) {
            try {
                String jsonParams = objectMapper.writeValueAsString(paramsMap);
                entity.setStrategyParams(jsonParams);
            } catch (JsonProcessingException e) {
                log.error("Lỗi khi convert strategy params sang JSON của cờ {}", featureState.getFeature().name(), e);
                entity.setStrategyParams("{}");
            }
        } else {
            entity.setStrategyParams(null);
        }

        // Lưu vào DB (JPA Auditing sẽ tự động cập nhật created_at, updated_by...)
        featureFlagRepo.save(entity);
    }
}
