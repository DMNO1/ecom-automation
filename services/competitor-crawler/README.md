# 竞品爬虫服务

电商平台竞品数据采集与分析服务，支持抖音、快手、拼多多、闲鱼等主流电商平台。

## 功能特性

### 核心功能
- **多平台支持**：抖音、快手、拼多多、闲鱼
- **数据采集**：标题、价格、主图hash、促销标签、评论关键词
- **定时轮询**：15分钟价格检查、30分钟标题检查
- **数据分析**：价格趋势、标题变化、促销监控
- **数据存储**：MongoDB + 文件系统双重存储

### 技术栈
- **Web框架**：FastAPI
- **爬虫引擎**：Playwright + httpx
- **数据分析**：jieba分词、imagehash图片处理
- **任务调度**：APScheduler
- **数据存储**：MongoDB (Motor异步驱动)
- **容器化**：Docker

## 快速开始

### 1. 安装依赖

```bash
cd ~/ecom-automation/services/competitor-crawler
pip install -r requirements.txt
```

### 2. 安装Playwright浏览器

```bash
playwright install chromium
```

### 3. 启动MongoDB

```bash
# 使用Docker启动MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或者使用本地安装的MongoDB
mongod --dbpath /data/db
```

### 4. 配置服务

复制配置文件并修改：

```bash
cp config.example.yaml config.yaml
# 编辑 config.yaml 修改配置
```

### 5. 启动服务

```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. 使用Docker部署

```bash
# 构建镜像
docker build -t competitor-crawler .

# 运行容器
docker run -d -p 8000:8000 --name competitor-crawler \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  competitor-crawler
```

## API文档

启动服务后访问：http://localhost:8000/docs

### 主要接口

#### 商品爬取

```bash
# 爬取单个商品
POST /crawl/single
{
  "platform": "douyin",
  "url": "https://www.douyin.com/product/123456"
}

# 批量爬取
POST /crawl
{
  "urls": [
    {"platform": "douyin", "url": "https://..."},
    {"platform": "pdd", "url": "https://..."}
  ]
}
```

#### 任务调度

```bash
# 创建价格检查任务（每15分钟）
POST /tasks
{
  "platform": "douyin",
  "product_id": "123456",
  "url": "https://...",
  "task_type": "price_check",
  "interval_minutes": 15
}

# 创建标题检查任务（每30分钟）
POST /tasks
{
  "platform": "douyin",
  "product_id": "123456",
  "url": "https://...",
  "task_type": "title_check",
  "interval_minutes": 30
}

# 获取所有任务
GET /tasks

# 暂停任务
POST /tasks/{task_id}/pause

# 恢复任务
POST /tasks/{task_id}/resume

# 删除任务
DELETE /tasks/{task_id}
```

#### 数据分析

```bash
# 价格趋势分析
GET /analysis/price/{platform}/{product_id}?days=30

# 标题变化分析
GET /analysis/title/{platform}/{product_id}?days=7

# 促销监控
GET /analysis/promotions/{platform}/{product_id}

# 生成竞品报告
GET /analysis/report/{product_id}?platforms=douyin,pdd
```

#### 数据查询

```bash
# 获取所有监控商品
GET /products

# 搜索商品
GET /products/search?keyword=手机

# 获取价格历史
GET /products/{platform}/{product_id}/history?days=30
```

## 项目结构

```
competitor-crawler/
├── main.py           # 主入口，FastAPI应用
├── crawler.py        # 核心爬虫模块
├── analyzer.py       # 数据分析模块
├── scheduler.py      # 定时任务调度
├── storage.py        # 数据存储模块
├── requirements.txt  # Python依赖
├── Dockerfile        # Docker配置
├── config.example.yaml # 配置示例
├── data/             # 数据存储目录
└── logs/             # 日志目录
```

## 配置说明

### 环境变量

```bash
# MongoDB连接
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=competitor_crawler

# 服务配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=false

# 爬虫配置
CRAWLER_TIMEOUT=30
CRAWLER_MAX_RETRIES=3
```

### 配置文件

参考 `config.example.yaml` 创建 `config.yaml` 配置文件。

## 监控与告警

### 健康检查

```bash
GET /health
```

### 服务统计

```bash
GET /stats
```

### 告警配置

支持多种通知方式：
- Webhook
- 邮件
- 钉钉
- 企业微信

在 `config.yaml` 中配置通知方式。

## 开发指南

### 添加新平台

1. 在 `crawler.py` 中创建新的爬虫类，继承 `BaseCrawler`
2. 实现 `crawl_product` 方法
3. 在 `CrawlerFactory` 中注册新平台
4. 在 `storage.py` 中添加平台枚举

### 自定义分析

1. 在 `analyzer.py` 中添加新的分析方法
2. 在 `main.py` 中添加对应的API接口

### 扩展通知

1. 在 `scheduler.py` 中实现通知发送逻辑
2. 在 `config.yaml` 中添加配置项

## 注意事项

1. **反爬虫**：请合理设置请求间隔，避免对目标网站造成压力
2. **数据使用**：采集的数据仅供内部研究使用，不得用于商业用途
3. **法律合规**：请遵守相关法律法规和平台使用条款
4. **资源管理**：定期清理过期数据，避免存储空间不足

## 故障排查

### 常见问题

1. **MongoDB连接失败**
   - 检查MongoDB服务是否启动
   - 验证连接URL和端口

2. **Playwright启动失败**
   - 运行 `playwright install chromium`
   - 安装系统依赖

3. **爬取失败**
   - 检查目标网站是否可访问
   - 查看日志文件排查具体错误

4. **任务调度异常**
   - 检查调度器状态 `GET /health`
   - 查看任务日志

### 日志查看

```bash
# 实时查看日志
tail -f logs/competitor_crawler.log

# 查看错误日志
grep "ERROR" logs/competitor_crawler.log
```

## 许可证

内部项目，未经授权不得外传。
