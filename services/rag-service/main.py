"""
RAG知识库服务 - FastAPI主入口
提供统一接口: /rag/query?domain=xxx
"""
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys

from routes import rag_router
from knowledge_base import knowledge_base
from retriever import retriever

# 配置日志
logger.remove()
logger.add(sys.stdout, level="INFO", format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>")
logger.add("logs/rag_service.log", rotation="10 MB", retention="30 days", level="INFO")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("Starting RAG Knowledge Base Service...")
    
    # 初始化知识库
    logger.info("Initializing knowledge base...")
    domains = knowledge_base.get_all_domains()
    for domain in domains:
        items = knowledge_base.load_knowledge(domain)
        logger.info(f"Loaded {len(items)} items for domain: {domain}")
    
    # 初始化检索器
    logger.info("Initializing vector retriever...")
    try:
        # 预热：执行一次空查询以加载模型
        retriever.search("product", "warmup", top_k=1)
        logger.info("Vector retriever initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing retriever: {e}")
    
    logger.info("RAG Knowledge Base Service started successfully")
    
    yield
    
    # 关闭时执行
    logger.info("Shutting down RAG Knowledge Base Service...")

# 创建FastAPI应用
app = FastAPI(
    title="RAG Knowledge Base Service",
    description="RAG知识库服务 - 提供商品FAQ/售后政策/平台规则/运营话术的智能检索",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录请求日志"""
    start_time = time.time()
    
    # 记录请求信息
    logger.info(f"Request: {request.method} {request.url}")
    
    # 处理请求
    response = await call_next(request)
    
    # 计算处理时间
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - Processed in {process_time:.4f}s")
    
    # 添加处理时间到响应头
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "path": str(request.url)
        }
    )

# 注册路由
app.include_router(rag_router)

# 根路径
@app.get("/")
async def root():
    """服务根路径"""
    return {
        "service": "RAG Knowledge Base Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "query": "/rag/query?domain=xxx&query=xxx",
            "query_all": "/rag/query/all?query=xxx",
            "knowledge": "/rag/knowledge/{domain}",
            "domains": "/rag/domains",
            "stats": "/rag/stats"
        }
    }

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查接口"""
    try:
        # 检查知识库状态
        kb_stats = knowledge_base.get_stats()
        
        # 检查检索器状态
        retriever_stats = retriever.get_stats()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "knowledge_base": kb_stats,
            "retriever": {
                "indexed_domains": retriever_stats["indexed_domains"],
                "total_vectors": retriever_stats["total_vectors"]
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

# 启动信息
if __name__ == "__main__":
    import uvicorn
    
    # 从环境变量获取配置
    host = os.getenv("RAG_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("RAG_SERVICE_PORT", "8001"))
    reload = os.getenv("RAG_SERVICE_RELOAD", "false").lower() == "true"
    
    logger.info(f"Starting RAG service on {host}:{port}")
    logger.info(f"Reload mode: {reload}")
    logger.info(f"API documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
        access_log=True
    )