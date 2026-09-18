create schema feature_flag_db;
use feature_flag_db;

CREATE TABLE feature_flags
(
    id              VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    name            VARCHAR(100)                          NOT NULL,
    description     VARCHAR(500)                          NULL,
    enabled         TINYINT(1)                            NOT NULL,
    
    -- Cột lưu danh sách thuật toán dưới dạng JSON array
    -- Ví dụ: [{"strategyId":"user-role","params":{"roles":"ROLE_BUYER"}},{"strategyId":"username","params":{"users":"duymk123"}}]
    strategies      JSON                                  NULL,
    
    -- Logic kết hợp giữa các strategy: 'OR' (mặc định) hoặc 'AND'
    strategy_logic  VARCHAR(3)  DEFAULT 'OR'               NOT NULL,
    
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

CREATE TABLE feature_flag_audit
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    flag_name       VARCHAR(255)                         NOT NULL,
    action          VARCHAR(255)                         NOT NULL,
    details         VARCHAR(1000)                        NULL,
    performed_by    VARCHAR(255)                         NOT NULL,
    timestamp       DATETIME(6)                          NOT NULL
);
