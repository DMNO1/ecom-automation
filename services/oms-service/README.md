# OMS订单中台服务

电商订单管理系统中台服务，提供多平台订单汇总、库存管理、工单处理和统一运营看板功能。

## 功能特性

### 1. 多平台订单管理
- 支持抖店、快手、拼多多、闲鱼等电商平台
- 订单状态跟踪（待处理、处理中、已发货、已完成、退款中等）
- 支付状态管理
- 订单标签和风险等级管理

### 2. 库存管理
- SKU级别库存管理
- 可用库存、锁定库存、在途库存
- 库存预警和风险标签
- 自动风险等级评估

### 3. 工单管理
- 售后工单处理（退款、换货、退货、投诉、咨询）
- 工单状态跟踪
- 优先级管理
- 退款状态跟踪

### 4. 统一运营看板
- 订单统计和趋势分析
- 库存状态概览
- 工单处理效率
- 平台对比分析
- 系统告警信息

## API接口

### 订单管理
- `GET /api/orders` - 获取所有订单
- `GET /api/orders/{order_id}` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/{order_id}/status` - 更新订单状态
- `GET /api/orders/statistics` - 获取订单统计

### 库存管理
- `GET /api/inventory` - 获取所有库存
- `GET /api/inventory/{sku_id}` - 获取库存详情
- `POST /api/inventory` - 创建库存项目
- `POST /api/inventory/{sku_id}/lock` - 锁定库存
- `POST /api/inventory/{sku_id}/unlock` - 解锁库存
- `GET /api/inventory/statistics` - 获取库存统计

### 工单管理
- `GET /api/tickets` - 获取所有工单
- `GET /api/tickets/{ticket_id}` - 获取工单详情
- `POST /api/tickets` - 创建工单
- `PUT /api/tickets/{ticket_id}/status` - 更新工单状态
- `PUT /api/tickets/{ticket_id}/assign` - 分配工单
- `GET /api/tickets/statistics` - 获取工单统计

### 运营看板
- `GET /api/dashboard` - 获取运营看板数据
- `GET /api/dashboard/overview` - 获取概览数据
- `GET /api/dashboard/platform/{platform}` - 获取指定平台数据
- `GET /api/dashboard/trends` - 获取趋势数据
- `GET /api/dashboard/alerts` - 获取告警信息

## 启动服务

### 本地开发
```bash
cd ~/ecom-automation/services/oms-service
pip install -r requirements.txt
python main.py
```

服务将在 http://localhost:8005 启动

### Docker部署
```bash
cd ~/ecom-automation/services/oms-service
docker build -t oms-service .
docker run -p 8005:8005 oms-service
```

## 服务信息

- 端口: 8005
- 版本: 1.0.0
- 健康检查: `GET /health`
- API文档: `GET /docs` (Swagger UI)

## 目录结构

```
oms-service/
├── main.py                 # FastAPI主入口
├── models.py              # 数据模型
├── order_manager.py       # 订单管理器
├── inventory_manager.py   # 库存管理器
├── ticket_manager.py      # 工单管理器
├── routes/                # API路由
│   ├── __init__.py
│   ├── order_routes.py
│   ├── inventory_routes.py
│   ├── ticket_routes.py
│   └── dashboard_routes.py
├── requirements.txt       # Python依赖
├── Dockerfile            # Docker配置
└── README.md             # 说明文档
```

## 数据模型

### 订单 (Order)
- 订单ID、平台来源、订单状态、支付状态
- 商品列表、金额信息
- 客户信息、物流信息
- 标签、风险等级

### 库存 (InventoryItem)
- SKU ID、商品名称、所属平台
- 总库存、可用库存、锁定库存、在途库存
- 预警设置、风险标签、风险等级

### 工单 (Ticket)
- 工单ID、关联订单、平台来源
- 工单类型、状态、优先级
- 问题描述、解决方案
- 退款信息（如适用）

## 示例数据

服务内置了示例数据，包括：
- 3个示例订单（抖音、快手、拼多多）
- 5个库存项目（各平台商品）
- 5个工单（退款、换货、投诉等类型）

启动后即可查看和操作这些示例数据。
