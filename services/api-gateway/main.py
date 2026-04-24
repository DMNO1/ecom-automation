"""
Hermes 多平台电商自动化系统 - API网关
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入路由
from routes import shops, products, orders, messages, aftersales, competitors, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("🚀 API网关启动中...")
    # 启动时执行
    yield
    # 关闭时执行
    logger.info("🛑 API网关关闭")

# 创建FastAPI应用
app = FastAPI(
    title="Hermes 电商自动化 API",
    description="多平台电商自动化系统统一API网关",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"📥 {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"📤 {request.method} {request.url.path} - {response.status_code}")
    return response

# 健康检查
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ecom-api-gateway",
        "version": "1.0.0"
    }

# 导入 auth 路由
from routes.auth import oauth

# 注册路由
app.include_router(oauth.router, prefix="/api/auth", tags=["统一鉴权管理"])
app.include_router(shops.router, prefix="/api/shops", tags=["店铺管理"])
app.include_router(products.router, prefix="/api/products", tags=["商品管理"])
app.include_router(orders.router, prefix="/api/orders", tags=["订单管理"])
app.include_router(messages.router, prefix="/api/messages", tags=["客服消息"])
app.include_router(aftersales.router, prefix="/api/aftersales", tags=["售后服务"])
app.include_router(competitors.router, prefix="/api/competitors", tags=["竞品分析"])
app.include_router(reports.router, prefix="/api/reports", tags=["报表统计"])

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ 全局异常: {exc}")
    return HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_GATEWAY_HOST", "0.0.0.0"),
        port=int(os.getenv("API_GATEWAY_PORT", "8000")),
        workers=int(os.getenv("API_GATEWORKERS", "4")),
        reload=True
    )
