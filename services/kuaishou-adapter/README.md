# 快手Adapter服务

快手开放平台API适配器服务，提供商品、订单、库存、物流等管理功能。

## 功能特性

- **商品管理**: 获取商品列表、商品详情
- **订单管理**: 获取订单列表、订单详情
- **库存管理**: 更新商品库存
- **物流管理**: 发货操作
- **OAuth授权**: 授权管理、token刷新

## API端点

所有API端点都以 `/api/shop/kuaishou` 为前缀。

### 商品API
- `GET /api/shop/kuaishou/products/list` - 获取商品列表
- `GET /api/shop/kuaishou/products/detail/{product_id}` - 获取商品详情

### 订单API
- `GET /api/shop/kuaishou/orders/list` - 获取订单列表
- `GET /api/shop/kuaishou/orders/detail/{order_id}` - 获取订单详情

### 库存API
- `POST /api/shop/kuaishou/inventory/update` - 更新库存

### 物流API
- `POST /api/shop/kuaishou/logistics/send` - 发货

### 授权API
- `GET /auth/url` - 获取授权URL
- `POST /auth/callback` - 授权回调
- `POST /auth/refresh` - 刷新token

## 配置

1. 复制 `.env.example` 为 `.env`
2. 配置快手开放平台的 `app_key` 和 `app_secret`
3. 通过 `/auth/url` 获取授权URL进行授权
4. 授权后通过 `/auth/callback` 获取access_token

## 运行

### 本地运行
```bash
# 安装依赖
pip install -r requirements.txt

# 运行服务
python main.py
```

### Docker运行
```bash
# 构建镜像
docker build -t kuaishou-adapter .

# 运行容器
docker run -p 8002:8002 --env-file .env kuaishou-adapter
```

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| KUAISHOU_APP_KEY | 快手应用AppKey | 是 |
| KUAISHOU_APP_SECRET | 快手应用AppSecret | 是 |
| KUAISHOU_ACCESS_TOKEN | 访问令牌 | 否 |
| KUAISHOU_REFRESH_TOKEN | 刷新令牌 | 否 |
| KUAISHOU_SHOP_ID | 店铺ID | 否 |

## 技术栈

- FastAPI
- Pydantic
- HTTPX
- Loguru
- Uvicorn

## 注意事项

1. 本适配器基于快手开放平台API开发，具体API端点和参数需要根据实际API文档进行调整
2. 签名生成规则需要根据快手开放平台的实际要求进行实现
3. 建议在生产环境中使用HTTPS和适当的安全措施