import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from dotenv import load_dotenv
from models import DouyinConfig, ApiResponse
from auth import init_auth_manager
from douyin_client import init_douyin_client
from routes import products, orders, inventory, aftersales, logistics

# 加载环境变量
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    logger.info("初始化抖店Adapter服务...")
    
    try:
        # 从环境变量加载配置
        config = DouyinConfig(
            app_key=os.getenv("DOUYIN_APP_KEY", ""),
            app_secret=os.getenv("DOUYIN_APP_SECRET", ""),
            access_token=os.getenv("DOUYIN_ACCESS_TOKEN"),
            refresh_token=os.getenv("DOUYIN_REFRESH_TOKEN"),
            shop_id=os.getenv("DOUYIN_shop_id")
        )
        
        if not config.app_key or not config.app_secret:
            logger.warning("抖店配置不完整，请设置DOUYIN_APP_KEY和DOUYIN_APP_SECRET环境变量")
        else:
            # 初始化授权管理器
            auth_manager = init_auth_manager(config)
            
            # 初始化抖店客户端
            init_douyin_client(auth_manager)
            
            logger.info("抖店Adapter服务初始化完成")
        
    except Exception as e:
        logger.error(f"初始化失败: {e}")
    
    yield
    
    # 关闭时清理
    logger.info("关闭抖店Adapter服务...")


# 创建FastAPI应用
app = FastAPI(
    title="抖店Adapter服务",
    description="抖店开放平台API适配器，提供商品、订单、库存、售后、物流等管理功能",
    version="1.0.0",
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

# 注册路由
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(aftersales.router, prefix="/api")
app.include_router(logistics.router, prefix="/api")


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "抖店Adapter服务",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


@app.get("/auth/url")
async def get_auth_url(redirect_uri: str):
    """获取授权URL
    
    Args:
        redirect_uri: 授权回调地址
    
    Returns:
        授权URL
    """
    try:
        from auth import get_auth_manager
        auth_manager = get_auth_manager()
        auth_url = auth_manager.get_auth_url(redirect_uri)
        
        return ApiResponse(
            code=0,
            message="success",
            data={"auth_url": auth_url}
        )
    except Exception as e:
        logger.error(f"获取授权URL失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/callback")
async def auth_callback(code: str):
    """授权回调
    
    Args:
        code: 授权码
    
    Returns:
        token信息
    """
    try:
        from auth import get_auth_manager
        auth_manager = get_auth_manager()
        result = await auth_manager.get_access_token(code)
        
        return ApiResponse(
            code=0,
            message="success",
            data=result
        )
    except Exception as e:
        logger.error(f"授权回调失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/refresh")
async def refresh_token():
    """刷新token
    
    Returns:
        新的token信息
    """
    try:
        from auth import get_auth_manager
        auth_manager = get_auth_manager()
        result = await auth_manager.refresh_access_token()
        
        return ApiResponse(
            code=0,
            message="success",
            data=result
        )
    except Exception as e:
        logger.error(f"刷新token失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
