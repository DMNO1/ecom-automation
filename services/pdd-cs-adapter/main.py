"""
拼多多客服自动化服务 - 主入口
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 导入路由
try:
    from .routes import router
except ImportError:
    # 当直接运行时
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from routes import router

# 导入其他模块
try:
    from .message_handler import MessageHandler
    from .playwright_bot import PlaywrightBot
    from .knowledge_base import KnowledgeBase
    from .config import settings
except ImportError:
    # 当直接运行时
    from message_handler import MessageHandler
    from playwright_bot import PlaywrightBot
    from knowledge_base import KnowledgeBase
    from config import settings

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("启动拼多多客服自动化服务...")
    
    # 初始化组件
    app.state.knowledge_base = KnowledgeBase()
    app.state.message_handler = MessageHandler(knowledge_base=app.state.knowledge_base)
    app.state.playwright_bot = PlaywrightBot()
    
    # 启动后台任务
    background_task = asyncio.create_task(background_message_processor(app))
    
    yield
    
    # 清理资源
    logger.info("关闭服务...")
    background_task.cancel()
    if app.state.playwright_bot:
        await app.state.playwright_bot.close()


async def background_message_processor(app: FastAPI):
    """后台消息处理任务"""
    logger.info("启动后台消息处理...")
    while True:
        try:
            # 这里可以添加定时任务，比如轮询消息
            await asyncio.sleep(settings.POLL_INTERVAL)
            # 实际逻辑在playwright_bot中处理
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"后台任务错误: {e}")
            await asyncio.sleep(5)


# 创建FastAPI应用
app = FastAPI(
    title="拼多多客服自动化服务",
    description="自动处理客服消息、FAQ回复、风险分级和人工转接",
    version="1.0.0",
    lifespan=lifespan
)

# 解析CORS origins
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS else []

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": "拼多多客服自动化服务",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
