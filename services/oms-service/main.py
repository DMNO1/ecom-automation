from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from datetime import datetime

from order_manager import OrderManager
from inventory_manager import InventoryManager
from ticket_manager import TicketManager
from routes import order_router, inventory_router, ticket_router, dashboard_router

app = FastAPI(
    title="OMS订单中台服务",
    description="电商订单管理系统中台，提供多平台订单汇总、库存管理、工单处理等功能",
    version="1.0.0"
)

# 配置CORS
cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化管理器
order_manager = OrderManager()
inventory_manager = InventoryManager()
ticket_manager = TicketManager()

# 包含路由
app.include_router(order_router, prefix="/api/orders", tags=["订单管理"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["库存管理"])
app.include_router(ticket_router, prefix="/api/tickets", tags=["工单管理"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["运营看板"])


@app.get("/", tags=["健康检查"])
async def health_check():
    """健康检查接口"""
    return {
        "service": "OMS订单中台服务",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/health", tags=["健康检查"])
async def health():
    """健康检查端点"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """服务启动时初始化数据"""
    print("OMS订单中台服务启动中...")
    # 这里可以添加数据库连接、缓存初始化等
    print("服务启动完成")


@app.on_event("shutdown")
async def shutdown_event():
    """服务关闭时清理资源"""
    print("OMS订单中台服务关闭中...")
    # 这里可以添加资源清理逻辑
    print("服务已关闭")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8005,
        reload=True,
        log_level="info"
    )
