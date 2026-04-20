# RAG知识库服务

RAG (Retrieval-Augmented Generation) 知识库服务，提供商品FAQ、售后政策、平台规则、运营话术的智能检索功能。

## 功能特性

- **多领域知识库**: 支持4个知识领域：
  - `product`: 商品FAQ
  - `aftersale`: 售后政策
  - `rules`: 平台规则
  - `scripts`: 运营话术

- **智能检索**: 基于语义相似度的向量检索
- **统一接口**: `/rag/query?domain=xxx` 统一查询接口
- **RESTful API**: 完整的CRUD操作支持
- **高性能**: 使用FAISS进行高效向量检索
- **可扩展**: 支持自定义知识库和模型

## 快速开始

### 1. 安装依赖

```bash
cd /Users/Zhuanz1/ecom-automation/services/rag-service
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python main.py
```

服务默认运行在 `http://localhost:8001`

### 3. 使用Docker

```bash
# 构建镜像
docker build -t rag-service .

# 运行容器
docker run -d -p 8001:8001 --name rag-service rag-service
```

## API接口

### 查询接口

#### 单领域查询
```http
GET /rag/query?domain=product&query=手机电池续航怎么样&top_k=5&threshold=0.5
```

#### 全领域查询
```http
GET /rag/query/all?query=退换货政策&top_k=3
```

### 知识管理接口

#### 获取知识条目
```http
GET /rag/knowledge/{domain}?category=电子产品&limit=100
```

#### 创建知识条目
```http
POST /rag/knowledge/{domain}
Content-Type: application/json

{
  "id": "prod_003",
  "domain": "product",
  "category": "电子产品",
  "question": "这款手机支持5G吗？",
  "answer": "支持全网通5G，覆盖主流5G频段。",
  "keywords": ["5G", "网络", "全网通"],
  "metadata": {"brand": "示例品牌"}
}
```

#### 更新知识条目
```http
PUT /rag/knowledge/{domain}/{item_id}
Content-Type: application/json

{
  "answer": "支持全网通5G，覆盖主流5G频段，支持双卡双待。",
  "keywords": ["5G", "网络", "全网通", "双卡"]
}
```

#### 删除知识条目
```http
DELETE /rag/knowledge/{domain}/{item_id}
```

### 管理接口

#### 获取所有领域
```http
GET /rag/domains
```

#### 重建索引
```http
POST /rag/rebuild-index/{domain}
POST /rag/rebuild-index-all
```

#### 获取统计信息
```http
GET /rag/stats
```

## 数据结构

### 知识条目模型
```python
class KnowledgeItem(BaseModel):
    id: str                    # 唯一标识符
    domain: str                # 知识领域
    category: str              # 分类
    question: str              # 问题
    answer: str                # 答案
    keywords: List[str] = []   # 关键词
    metadata: Dict[str, Any] = {}  # 元数据
    created_at: datetime       # 创建时间
    updated_at: datetime       # 更新时间
```

## 配置

### 环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

主要配置项：
- `RAG_SERVICE_HOST`: 服务监听地址
- `RAG_SERVICE_PORT`: 服务端口
- `MODEL_NAME`: 文本向量化模型
- `DATA_DIR`: 知识库存储目录
- `INDEX_DIR`: 向量索引存储目录

## 目录结构

```
rag-service/
├── main.py                 # FastAPI主入口
├── knowledge_base.py       # 知识库管理
├── retriever.py            # 向量检索
├── routes/                 # API路由
│   ├── __init__.py
│   └── rag.py
├── requirements.txt        # Python依赖
├── Dockerfile             # Docker配置
├── .env.example           # 环境变量示例
├── data/                  # 知识库数据
│   ├── product/
│   ├── aftersale/
│   ├── rules/
│   └── scripts/
├── indexes/               # 向量索引
└── logs/                  # 日志文件
```

## 开发指南

### 添加新的知识领域

1. 在 `knowledge_base.py` 中添加新的领域到 `domains` 列表
2. 创建对应的示例数据
3. 重启服务

### 更换向量化模型

1. 修改 `retriever.py` 中的 `model_name` 参数
2. 重建索引：`POST /rag/rebuild-index-all`

### 性能优化

1. 使用GPU加速的FAISS版本
2. 添加Redis缓存层
3. 使用异步模型加载

## 故障排除

### 常见问题

1. **模型下载失败**
   - 检查网络连接
   - 使用国内镜像源
   - 手动下载模型文件

2. **内存不足**
   - 减少 `top_k` 参数
   - 使用更小的模型
   - 分批处理大量数据

3. **检索效果不佳**
   - 调整相似度阈值
   - 优化知识条目内容
   - 尝试不同的向量化模型

## 许可证

MIT License