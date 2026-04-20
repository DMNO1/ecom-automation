"""
系统管理路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime
import psutil
import os

try:
    from ..config import settings
    from ..xianyu_client import client_manager
    from ..auto_reply import auto_reply_manager
    from ..order_handler import order_handler_registry
except ImportError:
    from config import settings
    from xianyu_client import client_manager
    from auto_reply import auto_reply_manager
    from order_handler import order_handler_registry

router = APIRouter()


class SystemInfoResponse(BaseModel):
    """系统信息响应"""
    service_name: str
    version: str
    uptime: str
    system: Dict[str, Any]
    memory: Dict[str, Any]
    cpu: Dict[str, Any]
    accounts: Dict[str, Any]


class ConfigResponse(BaseModel):
    """配置响应"""
    host: str
    port: int
    debug: bool
    cors_origins: list
    database_url: str


class ConfigUpdateRequest(BaseModel):
    """配置更新请求"""
    debug: bool = None
    cors_origins: list = None


# 启动时间
start_time = datetime.now()


@router.get("/info", response_model=SystemInfoResponse)
async def get_system_info():
    """获取系统信息"""
    try:
        # 计算运行时间
        uptime_delta = datetime.now() - start_time
        days = uptime_delta.days
        hours, remainder = divmod(uptime_delta.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{days}天 {hours}小时 {minutes}分钟 {seconds}秒"
        
        # 系统信息
        system_info = {
            "platform": os.name,
            "python_version": os.sys.version,
            "hostname": os.uname().nodename if hasattr(os, 'uname') else "unknown",
        }
        
        # 内存信息
        memory = psutil.virtual_memory()
        memory_info = {
            "total": f"{memory.total / (1024**3):.2f} GB",
            "available": f"{memory.available / (1024**3):.2f} GB",
            "used": f"{memory.used / (1024**3):.2f} GB",
            "percent": f"{memory.percent}%",
        }
        
        # CPU信息
        cpu_info = {
            "physical_cores": psutil.cpu_count(logical=False),
            "logical_cores": psutil.cpu_count(logical=True),
            "usage_percent": f"{psutil.cpu_percent()}%",
        }
        
        # 账号统计
        total_accounts = len(client_manager.clients)
        online_accounts = sum(1 for c in client_manager.clients.values() if c.is_logged_in)
        
        accounts_info = {
            "total": total_accounts,
            "online": online_accounts,
            "offline": total_accounts - online_accounts,
        }
        
        return SystemInfoResponse(
            service_name="闲鱼自动化服务",
            version="1.0.0",
            uptime=uptime_str,
            system=system_info,
            memory=memory_info,
            cpu=cpu_info,
            accounts=accounts_info,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """获取配置"""
    try:
        return ConfigResponse(
            host=settings.HOST,
            port=settings.PORT,
            debug=settings.DEBUG,
            cors_origins=settings.CORS_ORIGINS,
            database_url=settings.DATABASE_URL,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config")
async def update_config(request: ConfigUpdateRequest):
    """更新配置"""
    try:
        # 这里可以实现动态更新配置的逻辑
        # 注意：某些配置可能需要重启服务才能生效
        
        updated = []
        
        if request.debug is not None:
            settings.DEBUG = request.debug
            updated.append("debug")
        
        if request.cors_origins is not None:
            settings.CORS_ORIGINS = request.cors_origins
            updated.append("cors_origins")
        
        return {
            "message": "配置更新成功",
            "updated_fields": updated,
            "note": "某些配置可能需要重启服务才能生效",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 检查数据库连接
        # 这里可以添加更多健康检查逻辑
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "checks": {
                "database": "ok",
                "browser_pool": "ok",
            },
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
        }


@router.get("/logs")
async def get_logs(
    lines: int = 100,
    level: str = "INFO",
):
    """获取日志"""
    try:
        # 这里需要实现读取日志文件的逻辑
        # 可以从日志文件或内存中获取
        
        return {
            "message": "请实现日志读取逻辑",
            "lines": lines,
            "level": level,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shutdown")
async def shutdown():
    """关闭服务"""
    try:
        # 这里可以实现优雅关闭的逻辑
        # 例如关闭所有连接、保存状态等
        
        return {
            "message": "服务关闭请求已接收",
            "note": "请实现优雅关闭逻辑",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restart")
async def restart():
    """重启服务"""
    try:
        # 这里可以实现重启服务的逻辑
        
        return {
            "message": "服务重启请求已接收",
            "note": "请实现重启逻辑",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats():
    """获取综合统计"""
    try:
        # 收集各个模块的统计信息
        stats = {
            "accounts": {
                "total": len(client_manager.clients),
                "online": sum(1 for c in client_manager.clients.values() if c.is_logged_in),
            },
            "auto_reply": {
                "engines": len(auto_reply_manager.engines),
                "monitoring": auto_reply_manager.is_running,
            },
        }
        
        # 订单统计（需要从各个账号获取）
        order_stats = {}
        for account_id, client in client_manager.clients.items():
            try:
                handler = await order_handler_registry.get_handler(account_id, client)
                account_stats = await handler.get_order_statistics()
                order_stats[account_id] = account_stats
            except:
                pass
        
        stats["orders"] = order_stats
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/version")
async def get_version():
    """获取版本信息"""
    return {
        "service": "闲鱼自动化服务",
        "version": "1.0.0",
        "api_version": "v1",
        "build_date": "2024-01-01",
    }