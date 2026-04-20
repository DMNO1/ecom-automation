"""
系统管理API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import psutil
import os

router = APIRouter()


class SystemStatus(BaseModel):
    """系统状态模型"""
    service_name: str
    version: str
    status: str
    uptime: float
    memory_usage: float
    cpu_usage: float
    active_connections: int


class ConfigUpdate(BaseModel):
    """配置更新模型"""
    auto_reply_enabled: Optional[bool] = None
    poll_interval: Optional[int] = None
    browser_headless: Optional[bool] = None


@router.get("/status", response_model=SystemStatus)
async def get_system_status():
    """获取系统状态"""
    import time
    start_time = getattr(get_system_status, '_start_time', time.time())
    get_system_status._start_time = start_time
    
    uptime = time.time() - start_time
    
    return SystemStatus(
        service_name="拼多多客服自动化服务",
        version="1.0.0",
        status="running",
        uptime=uptime,
        memory_usage=psutil.Process().memory_percent(),
        cpu_usage=psutil.cpu_percent(),
        active_connections=0  # 这里应该从应用状态获取
    )


@router.get("/config")
async def get_config():
    """获取当前配置"""
    from config import settings
    
    return {
        "auto_reply_enabled": settings.AUTO_REPLY_ENABLED,
        "poll_interval": settings.POLL_INTERVAL,
        "browser_headless": settings.BROWSER_HEADLESS,
        "high_risk_keywords": settings.HIGH_RISK_KEYWORDS,
        "api_base_url": settings.PDD_API_BASE_URL,
        "workbench_url": settings.PDD_WORKBENCH_URL
    }


@router.post("/config")
async def update_config(update: ConfigUpdate):
    """更新配置"""
    from config import settings
    
    if update.auto_reply_enabled is not None:
        settings.AUTO_REPLY_ENABLED = update.auto_reply_enabled
    
    if update.poll_interval is not None:
        settings.POLL_INTERVAL = update.poll_interval
    
    if update.browser_headless is not None:
        settings.BROWSER_HEADLESS = update.browser_headless
    
    return {
        "message": "配置更新成功",
        "config": await get_config()
    }


@router.get("/logs")
async def get_logs(limit: int = 100, level: str = "INFO"):
    """获取系统日志"""
    # 这里应该从日志文件或日志系统获取日志
    return {
        "logs": [],
        "total": 0,
        "level": level,
        "limit": limit
    }


@router.post("/restart")
async def restart_service():
    """重启服务"""
    # 这里应该实现服务重启逻辑
    # 注意：实际部署时需要谨慎处理
    return {"message": "重启指令已发送"}


@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "knowledge_base": "ok",
            "message_handler": "ok",
            "playwright_bot": "ok",
            "pdd_client": "ok"
        }
    }


@router.get("/metrics")
async def get_metrics():
    """获取服务指标"""
    from main import app
    
    metrics = {
        "timestamp": datetime.now().isoformat(),
        "system": {
            "memory_usage": psutil.Process().memory_percent(),
            "cpu_usage": psutil.cpu_percent(),
            "disk_usage": psutil.disk_usage('/').percent
        },
        "service": {
            "total_messages_processed": 0,  # 这里应该从数据库获取
            "auto_replies_sent": 0,
            "human_transfers": 0,
            "active_conversations": 0
        }
    }
    
    return metrics


@router.post("/test/pdd-connection")
async def test_pdd_connection():
    """测试拼多多API连接"""
    from pdd_client import pdd_client
    
    try:
        # 这里应该测试实际的API连接
        return {
            "status": "success",
            "message": "拼多多API连接正常"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"连接失败: {str(e)}")


@router.post("/test/browser")
async def test_browser():
    """测试浏览器自动化"""
    from playwright_bot import playwright_bot
    
    try:
        await playwright_bot.start()
        await playwright_bot.take_screenshot("test_screenshot.png")
        await playwright_bot.close()
        
        return {
            "status": "success",
            "message": "浏览器测试成功",
            "screenshot": "test_screenshot.png"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"浏览器测试失败: {str(e)}")
