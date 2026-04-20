-- Hermes 多平台电商自动化系统 - 数据库初始化脚本
-- PostgreSQL 15+

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 店铺表
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('douyin', 'kuaishou', 'pdd', 'xianyu')),
    shop_name VARCHAR(255) NOT NULL,
    auth_status VARCHAR(20) DEFAULT 'pending' CHECK (auth_status IN ('active', 'expired', 'pending')),
    access_token TEXT,
    refresh_token TEXT,
    token_expire_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_platform ON shops(platform);
CREATE INDEX idx_shops_auth_status ON shops(auth_status);

-- 2. 商品表
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    platform_product_id VARCHAR(128),
    sku_id VARCHAR(128),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    stock INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('online', 'offline', 'draft')),
    listing_risk_score NUMERIC(5,2) DEFAULT 0,
    aftersales_risk_score NUMERIC(5,2) DEFAULT 0,
    margin_score NUMERIC(5,2) DEFAULT 0,
    images JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_platform_id ON products(platform_product_id);
CREATE INDEX idx_products_status ON products(status);

-- 3. 竞品监控目标表
CREATE TABLE competitor_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    url TEXT NOT NULL,
    nickname VARCHAR(255),
    watch_level INTEGER DEFAULT 3 CHECK (watch_level BETWEEN 1 AND 5),
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_targets_platform ON competitor_targets(platform);
CREATE INDEX idx_competitor_targets_enabled ON competitor_targets(enabled);

-- 4. 竞品快照表
CREATE TABLE competitor_snapshots (
    id BIGSERIAL PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES competitor_targets(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    price NUMERIC(12,2),
    sales_volume INTEGER,
    promo_tags JSONB DEFAULT '[]',
    image_hash VARCHAR(64),
    review_keywords JSONB DEFAULT '[]',
    raw_payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_target_id ON competitor_snapshots(target_id);
CREATE INDEX idx_snapshots_time ON competitor_snapshots(snapshot_time);

-- 5. 客服消息表
CREATE TABLE customer_messages (
    id BIGSERIAL PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    message_id VARCHAR(128),
    order_id VARCHAR(128),
    user_id VARCHAR(128),
    message_text TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'unknown' CHECK (category IN ('faq', 'logistics', 'refund', 'complaint', 'unknown')),
    risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    auto_reply TEXT,
    final_status VARCHAR(20) DEFAULT 'pending' CHECK (final_status IN ('replied', 'escalated', 'ignored', 'pending')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_shop_id ON customer_messages(shop_id);
CREATE INDEX idx_messages_platform ON customer_messages(platform);
CREATE INDEX idx_messages_risk_level ON customer_messages(risk_level);
CREATE INDEX idx_messages_created_at ON customer_messages(created_at);

-- 6. 售后工单表
CREATE TABLE aftersales_cases (
    id BIGSERIAL PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    order_id VARCHAR(128) NOT NULL,
    sku_id VARCHAR(128),
    issue_type VARCHAR(50) CHECK (issue_type IN ('size', 'quality', 'late_delivery', 'wrong_item', 'missing', 'other')),
    severity VARCHAR(10) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    refund_amount NUMERIC(12,2) DEFAULT 0,
    suggested_action TEXT,
    human_required BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'processing', 'closed')),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aftersales_shop_id ON aftersales_cases(shop_id);
CREATE INDEX idx_aftersales_status ON aftersales_cases(status);
CREATE INDEX idx_aftersales_severity ON aftersales_cases(severity);

-- 7. 任务执行记录表
CREATE TABLE task_runs (
    id BIGSERIAL PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    platform VARCHAR(20),
    shop_id UUID REFERENCES shops(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
    payload JSONB DEFAULT '{}',
    result_summary TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_runs_task_name ON task_runs(task_name);
CREATE INDEX idx_task_runs_status ON task_runs(status);
CREATE INDEX idx_task_runs_started_at ON task_runs(started_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_targets_updated_at BEFORE UPDATE ON competitor_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aftersales_cases_updated_at BEFORE UPDATE ON aftersales_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO shops (platform, shop_name, auth_status) VALUES
    ('douyin', '示例抖店', 'active'),
    ('pdd', '示例拼多多店铺', 'active'),
    ('xianyu', '示例闲鱼账号', 'active');

-- 创建视图：订单概览
CREATE VIEW order_overview AS
SELECT 
    s.platform,
    s.shop_name,
    COUNT(DISTINCT cm.id) as total_messages,
    COUNT(DISTINCT CASE WHEN cm.risk_level = 'high' THEN cm.id END) as high_risk_messages,
    COUNT(DISTINCT ac.id) as total_aftersales,
    COUNT(DISTINCT CASE WHEN ac.status = 'open' THEN ac.id END) as open_aftersales
FROM shops s
LEFT JOIN customer_messages cm ON s.id = cm.shop_id
LEFT JOIN aftersales_cases ac ON s.id = ac.shop_id
GROUP BY s.id, s.platform, s.shop_name;

-- 完成
SELECT 'Database initialization completed!' as status;
