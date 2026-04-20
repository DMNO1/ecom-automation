# 抖店Adapter服务

抖店开放平台API适配器服务，提供商品、订单、库存、售后、物流等管理功能。

## 功能特性

- **商品管理**: 获取商品列表、商品详情
- **订单管理**: 获取订单列表、订单详情
- **库存管理**: 更新商品库存
- **售后管理**: 获取售后列表
- **物流管理**: 发货操作
- **OAuth授权**: 授权管理、token刷新

## API端点

### 商品API
- `GET /api/products/list` - 获取商品列表
- `GET /api/products/detail/{product_id}` - 获取商品详情

### 订单API
- `GET /api/orders/list` - 获取订单列表
- `GET /api/orders/detail/{order_id}` - 获取订单详情

### 库存API
- `POST /api/inventory/update` - 更新库存

### 售后API
- `GET /api/aftersales/list` - 获取售后列表

### 物流API
- `POST /api/logistics/send` - 发货

### 授权API
- `GET /auth/url` - 获取授权URL
- `POST /auth/callback` - 授权回调
- `POST /auth/refresh` - 刷新token

## 配置

1. 复制 `.env.example` 为 `.env`
2. 配置抖店开放平台的 `app_key` 和 `app_secret`
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
docker build -t douyin-adapter .

# 运行容器
docker run -p 8001:8001 --env-file .env douyin-adapter
```

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| DOUYIN_APP_KEY | 抖店应用AppKey | 是 |
| DOUYIN_APP_SECRET | 抖店应用AppSecret | 是 |
| DOUYIN_ACCESS_TOKEN | 访问令牌 | 否 |
| DOUYIN_REFRESH_TOKEN | 刷新令牌 | 否 |
| DOUYIN_shop_id | 店铺ID | 否 |

## 技术栈

- FastAPI
- Pydantic
- HTTPX
- Loguru
- Uvicorn
