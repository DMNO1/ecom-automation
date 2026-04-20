# 拼多多客服自动化服务部署指南

## 快速开始

### 1. 本地开发

```bash
# 克隆或进入项目目录
cd ~/ecom-automation/services/pdd-cs-adapter

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install chromium

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入实际配置

# 启动服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 使用启动脚本

```bash
# 赋予执行权限
chmod +x start.sh

# 安装依赖并启动
./start.sh --install

# 或者直接启动
./start.sh

# 指定端口
./start.sh --port 8080
```

### 3. 使用Docker部署

```bash
# 构建镜像
docker build -t pdd-cs-adapter .

# 运行容器
docker run -d \
  --name pdd-cs-adapter \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  pdd-cs-adapter
```

### 4. 使用Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 配置说明

### 必需配置

在 `.env` 文件中配置以下变量：

```env
# 拼多多API凭证
PDD_CLIENT_ID=your_client_id
PDD_CLIENT_SECRET=your_client_secret

# 工作台登录凭证（用于浏览器自动化）
PDD_USERNAME=your_username
PDD_PASSWORD=your_password
```

### 可选配置

```env
# 自动回复配置
AUTO_REPLY_ENABLED=true
AUTO_REPLY_DELAY=2.0

# 浏览器配置
BROWSER_HEADLESS=true

# 数据库配置
DATABASE_URL=sqlite:///./data/pdd_cs.db

# Redis配置（可选）
REDIS_URL=redis://localhost:6379/0
```

## API文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 监控和日志

### 健康检查

```bash
curl http://localhost:8000/health
```

### 系统状态

```bash
curl http://localhost:8000/api/v1/system/status
```

### 查看日志

```bash
# Docker容器日志
docker logs pdd-cs-adapter

# 应用日志
tail -f logs/service.log
```

## 故障排除

### 1. 浏览器自动化失败

确保安装了Playwright浏览器：

```bash
playwright install chromium
```

### 2. 连接拼多多API失败

检查API凭证是否正确：

```bash
curl http://localhost:8000/api/v1/system/test/pdd-connection
```

### 3. 内存不足

如果使用Docker，确保分配足够内存（至少2GB）。

## 生产环境部署建议

1. **使用反向代理**：配置Nginx或Apache作为反向代理
2. **HTTPS**：配置SSL证书
3. **进程管理**：使用systemd或supervisor管理进程
4. **监控**：配置Prometheus和Grafana监控
5. **日志管理**：配置日志轮转和集中日志收集
6. **备份**：定期备份知识库和数据库

## 安全注意事项

1. 不要将 `.env` 文件提交到版本控制
2. 定期更新依赖包
3. 使用强密码
4. 限制API访问权限
5. 定期审查日志
