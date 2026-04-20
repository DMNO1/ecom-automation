# 闲鱼自动化服务

基于FastAPI + Playwright的闲鱼自动化服务，提供自动回复、商品管理、订单处理等功能。

## 功能特性

### 🔧 核心功能
- **多账号管理**: 支持同时管理多个闲鱼账号
- **AI自动回复**: 基于规则和AI的智能自动回复
- **商品管理**: 商品上架、下架、编辑、批量操作
- **订单处理**: 自动发货、确认发货、订单监控
- **浏览器自动化**: 基于Playwright的稳定浏览器操作

### 📊 管理功能
- **规则引擎**: 可配置的自动回复规则
- **模板系统**: 商品模板，快速创建商品
- **数据分析**: 订单和商品统计分析
- **日志系统**: 完整的操作日志记录

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
cd ~/ecom-automation/services/xianyu-adapter

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install chromium

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置你的设置
```

### 2. 启动服务

```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000

# 使用Docker
docker build -t xianyu-automation .
docker run -p 8000:8000 xianyu-automation
```

### 3. 访问API文档

打开浏览器访问: http://localhost:8000/docs

## API接口

### 账号管理
- `GET /api/v1/accounts` - 获取账号列表
- `POST /api/v1/accounts/login` - 登录账号
- `GET /api/v1/accounts/{account_id}/status` - 获取账号状态

### 消息管理
- `GET /api/v1/messages/{account_id}` - 获取消息列表
- `POST /api/v1/messages/send` - 发送消息
- `POST /api/v1/messages/auto-reply/config` - 配置自动回复

### 商品管理
- `GET /api/v1/products/{account_id}` - 获取商品列表
- `POST /api/v1/products/{account_id}` - 创建商品
- `PUT /api/v1/products/{account_id}/{product_id}` - 更新商品
- `POST /api/v1/products/{account_id}/batch-price` - 批量更新价格

### 订单管理
- `GET /api/v1/orders/{account_id}` - 获取订单列表
- `POST /api/v1/orders/ship` - 发货订单
- `POST /api/v1/orders/{account_id}/auto-ship` - 触发自动发货
- `GET /api/v1/orders/{account_id}/stats` - 获取订单统计

### 系统管理
- `GET /api/v1/system/info` - 获取系统信息
- `GET /api/v1/system/health` - 健康检查
- `GET /api/v1/system/stats` - 获取综合统计

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| HOST | 服务监听地址 | 0.0.0.0 |
| PORT | 服务端口 | 8000 |
| DEBUG | 调试模式 | true |
| DATABASE_URL | 数据库连接 | sqlite:///./xianyu.db |
| HEADLESS | 无头浏览器模式 | true |
| AI_API_KEY | OpenAI API密钥 | - |
| AI_MODEL | AI模型 | gpt-3.5-turbo |

### 自动回复规则

支持三种匹配模式：
- `exact`: 精确匹配
- `regex`: 正则表达式匹配
- `keyword`: 关键词匹配

### 自动发货规则

支持两种操作：
- `virtual_ship`: 虚拟商品自动发货
- `manual_review`: 需要人工审核

## 目录结构

```
xianyu-adapter/
├── main.py                 # FastAPI主入口
├── xianyu_client.py        # 闲鱼客户端
├── auto_reply.py           # 自动回复引擎
├── product_manager.py      # 商品管理
├── order_handler.py        # 订单处理
├── playwright_bot.py       # 浏览器自动化
├── database.py             # 数据库操作
├── config.py               # 配置管理
├── routes/                 # API路由
│   ├── __init__.py
│   ├── account_routes.py   # 账号路由
│   ├── message_routes.py   # 消息路由
│   ├── product_routes.py   # 商品路由
│   ├── order_routes.py     # 订单路由
│   └── system_routes.py    # 系统路由
├── requirements.txt        # Python依赖
├── Dockerfile              # Docker配置
├── .env.example            # 环境变量示例
└── README.md               # 项目说明
```

## 开发指南

### 添加新的自动回复规则

```python
from auto_reply import ReplyRule

new_rule = ReplyRule(
    id="custom_rule",
    name="自定义规则",
    pattern=r".*(你好|hello).*",
    reply_content="您好！有什么可以帮助您的吗？",
    priority=10,
    match_type="regex",
)
```

### 添加新的自动发货规则

```python
from order_handler import AutoShipRule

new_rule = AutoShipRule(
    id="custom_ship",
    name="自定义发货",
    product_id="specific_product",
    condition="paid",
    action="virtual_ship",
    delay_minutes=5,
)
```

## 注意事项

1. **合规使用**: 请遵守闲鱼平台规则，合理使用自动化功能
2. **频率控制**: 避免过于频繁的操作，建议设置合理的间隔时间
3. **数据安全**: 妥善保管账号信息和cookies数据
4. **风险提示**: 自动化操作可能存在账号风险，请谨慎使用

## 故障排除

### 浏览器启动失败
```bash
# 安装Playwright浏览器依赖
playwright install-deps
playwright install chromium
```

### 数据库连接失败
```bash
# 检查数据库文件权限
ls -la xianyu.db

# 重新创建数据库
rm xianyu.db
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

### 账号登录失败
1. 检查网络连接
2. 确认cookies文件是否存在
3. 尝试重新扫码登录

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发者。