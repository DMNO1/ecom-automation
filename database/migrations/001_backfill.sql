-- 回填脚本：将现有 shops 表的 token 信息迁移到 shop_auth_tokens 表

INSERT INTO shop_auth_tokens (
    shop_id,
    platform,
    access_token,
    refresh_token,
    expires_in,
    created_at,
    updated_at
)
SELECT
    id,
    platform,
    access_token,
    refresh_token,
    EXTRACT(EPOCH FROM (token_expire_at - NOW()))::INTEGER, -- 估算 expires_in
    created_at,
    updated_at
FROM shops
WHERE access_token IS NOT NULL;
