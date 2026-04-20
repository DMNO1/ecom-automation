# Hermes 多平台电商自动化系统

基于 Hermes Agent 的多平台电商自动化运营系统，支持抖店、快手电商、拼多多、闲鱼四大平台。

## 系统架构

```
[ Hermes 总控 ]
    ├─ ecom-competitor-analyst skill
    ├─ ecom-selection-scorer skill
    ├─ ecom-product-copywriter skill
    ├─ ecom-cs-router skill
    ├─ ecom-aftersales-triage skill
    ├─ ecom-risk-watchdog skill
    └─ ecom-daily-report skill
            │
            ▼
[ Orchestrator ]  n8n + internal API + Redis Queue
            │
            ├───────────────┬───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
  [平台适配器服务]   [抓取/RPA服务]    [知识库服务]      [OMS服务]
  Douyin Adapter    Xianyu Bot Worker   FAQ RAG API       Orders/Refunds
  Kuaishou Adapter  PDD CS Worker       Policy RAG API    Inventory
  PDD Adapter       Competitor Crawler  Product RAG API   Tickets
```

## 服务列表

| 服务 | 技术栈 | 说明 |
|------|--------|------|
| hermes-control | Python + Hermes | 总控、策略、调度、报表 |
| api-gateway | FastAPI | 统一REST API网关 |
| douyin-adapter | FastAPI + 官方SDK | 抖店平台适配器 |
| kuaishou-adapter | FastAPI + SDK | 快手平台适配器 |
| pdd-cs-adapter | Python + Playwright | 拼多多客服自动化 |
| xianyu-adapter | FastAPI + Playwright | 闲鱼自动化 |
| competitor-crawler | Python asyncio | 竞品数据采集 |
| rag-service | FastGPT/Dify | 知识库服务 |
| oms-service | FastAPI | 订单中台 |

## 快速开始

```bash
# 克隆项目
git clone https://github.com/DMNO1/ecom-automation.git
cd ecom-automation

# 安装依赖
pip install -r requirements.txt

# 启动服务
docker-compose up -d
```

## 开发阶段

### 第1阶段 (2-3周)
- [ ] 抖店 Adapter 基础版
- [ ] 拼多多客服自动化
- [ ] 闲鱼自动回复系统
- [ ] PostgreSQL + Redis + n8n
- [ ] Hermes 4个核心 Skills

### 第2阶段 (3-6周)
- [ ] OMS 基础版
- [ ] 竞品爬虫标准化
- [ ] 商品上架文案生成
- [ ] 合规审核
- [ ] 快手 Adapter

### 第3阶段 (6-10周)
- [ ] 选品评分模型
- [ ] 风险预警模型
- [ ] 多店铺路由
- [ ] 管理后台和BI看板

## 技术栈

- **主语言**: Python
- **Web框架**: FastAPI
- **数据库**: PostgreSQL 15+
- **缓存/队列**: Redis
- **工作流**: n8n
- **浏览器自动化**: Playwright
- **AI Agent**: Hermes
- **知识库**: Dify/FastGPT + pgvector
- **部署**: Docker Compose

## 许可证

Private
