-- Phase 1 Additive Migration
-- Do not drop existing columns. Add new tables for unified modeling.

-- 1. 统一鉴权层：店铺授权信息表
CREATE TABLE IF NOT EXISTS shop_auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_in INTEGER,
    refresh_expires_in INTEGER,
    token_type VARCHAR(50),
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_auth_tokens_shop_id ON shop_auth_tokens(shop_id);

-- 2. 统一商品层：多平台 SKU 表 (支持 outer_id 防超卖)
CREATE TABLE IF NOT EXISTS multi_platform_skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    platform VARCHAR(20) NOT NULL,
    platform_sku_id VARCHAR(128) NOT NULL,
    platform_product_id VARCHAR(128) NOT NULL,
    outer_id VARCHAR(128), -- 商家编码，关联全局库存
    sku_name TEXT NOT NULL,
    price NUMERIC(12,2),
    stock INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'online',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, platform_sku_id)
);
CREATE INDEX IF NOT EXISTS idx_skus_outer_id ON multi_platform_skus(outer_id);
CREATE INDEX IF NOT EXISTS idx_skus_shop_id ON multi_platform_skus(shop_id);

-- 3. 统一订单层：多平台订单主表
CREATE TABLE IF NOT EXISTS multi_platform_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    platform VARCHAR(20) NOT NULL,
    platform_order_id VARCHAR(128) NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    pay_amount NUMERIC(12,2),
    postage NUMERIC(12,2) DEFAULT 0,
    buyer_info JSONB DEFAULT '{}',
    receiver_info JSONB DEFAULT '{}',
    pay_time TIMESTAMPTZ,
    create_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, platform_order_id)
);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON multi_platform_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON multi_platform_orders(order_status);

-- 4. 统一订单层：多平台订单子项表
CREATE TABLE IF NOT EXISTS multi_platform_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES multi_platform_orders(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES multi_platform_skus(id),
    platform_sku_id VARCHAR(128) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    item_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON multi_platform_order_items(order_id);

-- 5. 商业级监控：订单状态操作留痕表
CREATE TABLE IF NOT EXISTS order_operate_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES multi_platform_orders(id) ON DELETE CASCADE,
    platform_order_id VARCHAR(128) NOT NULL,
    operator VARCHAR(50) DEFAULT 'system',
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    remark TEXT,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_operate_logs(order_id);

-- 6. Webhook 事件表 (替代轮询)
CREATE TABLE IF NOT EXISTS platform_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(128),
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    error_msg TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON platform_webhook_events(status);

-- 7. 库存预留表 (防超卖/分布式锁辅助)
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outer_id VARCHAR(128) NOT NULL,
    order_id UUID REFERENCES multi_platform_orders(id),
    platform_order_id VARCHAR(128) NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'reserved' CHECK (status IN ('reserved', 'committed', 'released')),
    expire_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_resv_outer_id ON inventory_reservations(outer_id);

-- 添加更新时间触发器
CREATE TRIGGER update_shop_auth_tokens_updated_at BEFORE UPDATE ON shop_auth_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_multi_platform_skus_updated_at BEFORE UPDATE ON multi_platform_skus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_multi_platform_orders_updated_at BEFORE UPDATE ON multi_platform_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_webhook_events_updated_at BEFORE UPDATE ON platform_webhook_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_reservations_updated_at BEFORE UPDATE ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
