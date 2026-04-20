# 拼多多客服自动化服务

基于FastAPI和Playwright的拼多多客服自动化服务，提供自动回复、风险分级、知识库管理等功能。

## 功能特性

- 🔄 自动读取客服消息
- 💬 FAQ自动回复（低风险消息）
- ⚠️ 风险分级和人工转接
- 📦 订单上下文辅助回复
- 🌐 浏览器自动化处理工作台
- 📊 系统监控和指标
- 📚 知识库管理

## 项目结构

```
pdd-cs-adapter/
├── main.py              # 主入口
├── config.py            # 配置管理
├── pdd_client.py        # 拼多多API客户端
├── message_handler.py   # 消息处理逻辑
├── playwright_bot.py    # 浏览器自动化
├── knowledge_base.py    # 客服知识库
├── routes/              # API路由
│   ├── __init__.py
│   ├── chat_routes.py   # 聊天相关API
│   ├── knowledge_routes.py  # 知识库管理API
│   └── system_routes.py     # 系统管理API
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 启动服务

```bash
uvicorn main:app --reload
```

### 4. 使用Docker部署

```bash
docker build -t pdd-cs-adapter .
docker run -p 8000:8000 --env-file .env pdd-cs-adapter
```

## API文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要API端点

### 聊天相关
- `GET /api/v1/chat/conversations` - 获取会话列表
- `POST /api/v1/chat/messages` - 处理消息
- `POST /api/v1/chat/auto-reply/start` - 启动自动回复

### 知识库管理
- `GET /api/v1/knowledge/faq` - 获取所有FAQ
- `POST /api/v1/knowledge/faq` - 创建FAQ
- `POST /api/v1/knowledge/search` - 搜索知识库

### 系统管理
- `GET /api/v1/system/status` - 获取系统状态
- `GET /api/v1/system/config` - 获取配置
- `POST /api/v1/system/test/browser` - 测试浏览器

## 配置说明

主要配置项：
- `PDD_CLIENT_ID` / `PDD_CLIENT_SECRET` - 拼多多API凭证
- `PDD_USERNAME` / `PDD_PASSWORD` - 工作台登录凭证
- `AUTO_REPLY_ENABLED` - 是否启用自动回复
- `BROWSER_HEADLESS` - 是否使用无头浏览器

## 开发说明

### 消息处理流程
1. 浏览器自动化读取工作台消息
2. 消息处理器分析风险等级
3. 低风险消息自动匹配知识库回复
4. 高风险消息转人工处理
5. 记录处理结果和指标

### 风险分级规则
- 低风险：普通咨询，可自动回复
- 中风险：需关注但可尝试自动回复
- 高风险：投诉、举报等，必须转人工

## 注意事项

1. 拼多多API需要申请权限
2. 浏览器自动化需要稳定网络环境
3. 建议定期更新知识库内容
4. 监控系统日志确保服务稳定

## License

MIT
