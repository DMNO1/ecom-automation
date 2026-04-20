# Hermes总控服务

Hermes总控服务是电商自动化平台的核心控制服务，负责任务调度、技能执行和报表生成。

## 功能特性

- **任务调度**: 支持多优先级任务队列，可调度到技能执行器、n8n工作流或内部API
- **技能执行**: 内置多种业务技能（竞品分析、客服路由、售后分诊等）
- **报表生成**: 自动生成日报、周报和异常检测报告
- **业务目标处理**: 根据业务目标智能创建相关任务

## 目录结构

```
hermes-control/
├── main.py              # FastAPI主入口
├── task_dispatcher.py   # 任务调度器
├── report_generator.py  # 报表生成器
├── skill_executor.py    # Skills执行器
├── config.py           # 配置管理
├── Dockerfile          # Docker构建文件
├── requirements.txt    # Python依赖
└── README.md          # 本文件
```

## 快速开始

### 本地开发

1. 安装依赖:
```bash
pip install -r requirements.txt
```

2. 设置环境变量:
```bash
cp .env.example .env  # 如果存在
# 或手动设置以下环境变量:
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ecommerce
export DB_USER=postgres
export DB_PASSWORD=your_password
export N8N_BASE_URL=http://localhost:5678
export N8N_API_KEY=your_api_key
```

3. 启动服务:
```bash
python main.py
# 或
uvicorn main:app --reload
```

### Docker部署

1. 构建镜像:
```bash
docker build -t hermes-control .
```

2. 运行容器:
```bash
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=your_db_host \
  -e N8N_BASE_URL=your_n8n_url \
  --name hermes-control \
  hermes-control
```

## API文档

启动服务后，访问以下地址查看API文档:
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

## 主要API端点

### 任务管理
- `POST /tasks` - 提交任务
- `GET /tasks` - 列出任务
- `GET /tasks/{task_id}` - 获取任务状态
- `DELETE /tasks/{task_id}` - 取消任务
- `GET /queue/status` - 获取队列状态

### 技能执行
- `POST /skills/execute` - 执行技能
- `GET /skills` - 列出所有技能
- `GET /skills/{skill_name}` - 获取技能信息

### 报表生成
- `POST /reports/generate` - 生成报表
- `GET /reports` - 列出报表
- `POST /reports/cleanup` - 清理旧报表

### 业务目标
- `POST /goals/process` - 处理业务目标

## 内置技能

1. **competitor_analysis** - 竞品分析
2. **customer_service_router** - 客服路由
3. **after_sales_triage** - 售后分诊
4. **daily_report** - 日报生成
5. **weekly_report** - 周报生成
6. **abnormal_detection** - 异常检测

## 任务类型

任务类型格式为 `{source}:{name}`:
- `skill:{skill_name}` - 执行技能
- `n8n:{workflow_name}` - 调用n8n工作流
- `api:{endpoint}` - 调用内部API

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名称 | ecommerce |
| DB_USER | 数据库用户 | postgres |
| DB_PASSWORD | 数据库密码 | |
| N8N_BASE_URL | n8n服务地址 | http://localhost:5678 |
| N8N_API_KEY | n8n API密钥 | |
| REDIS_HOST | Redis主机 | localhost |
| REDIS_PORT | Redis端口 | 6379 |
| LOG_LEVEL | 日志级别 | INFO |
| DEBUG | 调试模式 | false |

## 开发

### 添加新技能

1. 在 `skill_executor.py` 中添加新的技能函数
2. 在 `config.py` 的 `skill_mapping` 中添加技能映射
3. 重启服务

### 测试

```bash
pytest tests/
```

## 监控

服务提供以下监控端点:
- `GET /health` - 健康检查
- `GET /config` - 服务配置

## 许可证

内部项目