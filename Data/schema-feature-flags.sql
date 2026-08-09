create schema feature_flag_db;
use feature_flag_db;

CREATE TABLE feature_flags
(
    id              VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    name            VARCHAR(100)                          NOT NULL,
    description     VARCHAR(500)                          NULL,
    enabled         TINYINT(1)                            NOT NULL,
    
    -- Cột lưu tên thuật toán (Ví dụ: gradual-rollout, users-by-role, client-ip)
    strategy_id     VARCHAR(50)                           NULL,
    
    -- Cột lưu tham số thuật toán dưới dạng chuỗi JSON
    strategy_params JSON                                  NULL,
    
    -- Các cột Audit (Theo dõi lịch sử thay đổi)
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      DATETIME    DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by      VARCHAR(255)                          NULL,
    updated_by      VARCHAR(255)                          NULL,
    
    -- Xóa mềm
    deleted         TINYINT(1)  DEFAULT 0                 NOT NULL,
    
    -- Ràng buộc tên cờ không được trùng lặp
    CONSTRAINT uk_feature_name UNIQUE (name)
);
