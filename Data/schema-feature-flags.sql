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

CREATE TABLE customers
(
    id            VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    customer_code VARCHAR(100)                         NOT NULL,
    name          VARCHAR(255)                         NOT NULL,
    ip_address    VARCHAR(100)                         NOT NULL,
    created_at    DATETIME    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    DATETIME    DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_customer_code UNIQUE (customer_code),
    CONSTRAINT uk_customer_ip UNIQUE (ip_address)
);

CREATE TABLE customer_feature_flags
(
    id              VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    customer_id     VARCHAR(36)                          NOT NULL,
    flag_name       VARCHAR(100)                         NOT NULL,
    enabled         TINYINT(1)                           NOT NULL,
    strategy_id     VARCHAR(100)                         NULL,
    strategy_params JSON                                 NULL,
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      DATETIME    DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_feature_flags_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT uk_customer_feature_flag UNIQUE (customer_id, flag_name)
);
