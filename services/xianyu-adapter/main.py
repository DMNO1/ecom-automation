"""
闲鱼自动化服务 - FastAPI主入口
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .routes import router
    from .database import init_db
    from .config import settings
except ImportError:
    # 当作为独立脚本运行时
    from routes import router
    from database import init_db
    from config import settings

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    logger.info("闲鱼自动化服务启动中...")
    await init_db()
    logger.info("数据库初始化完成")
    
    yield
    
    # 关闭时清理
    logger.info("闲鱼自动化服务关闭中...")


app = FastAPI(
    title="闲鱼自动化服务",
    description="提供闲鱼自动回复、商品管理、订单处理等功能",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "service": "闲鱼自动化服务",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )