"""
账号管理路由
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

try:
    from ..xianyu_client import client_manager, XianyuClient
except ImportError:
    from xianyu_client import client_manager, XianyuClient

router = APIRouter()


class AccountInfo(BaseModel):
    """账号信息"""
    account_id: str
    username: Optional[str] = None
    status: str = "offline"  # online, offline, error
    last_login: Optional[datetime] = None
    cookies_exist: bool = False


class LoginRequest(BaseModel):
    """登录请求"""
    account_id: str
    auto_login: bool = True


class LoginResponse(BaseModel):
    """登录响应"""
    success: bool
    message: str
    account_id: str
    qrcode_url: Optional[str] = None  # 如果需要扫码登录


@router.get("/", response_model=List[AccountInfo])
async def list_accounts():
    """获取所有账号列表"""
    try:
        accounts = []
        for account_id, client in client_manager.clients.items():
            account_info = AccountInfo(
                account_id=account_id,
                status="online" if client.is_logged_in else "offline",
                cookies_exist=bool(await client._check_login_status()),
            )
            accounts.append(account_info)
        
        return accounts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}", response_model=AccountInfo)
async def get_account(account_id: str):
    """获取单个账号信息"""
    try:
        client = await client_manager.get_client(account_id)
        
        return AccountInfo(
            account_id=account_id,
            status="online" if client.is_logged_in else "offline",
            cookies_exist=bool(await client._check_login_status()),
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=LoginResponse)
async def login_account(request: LoginRequest):
    """登录账号"""
    try:
        client = await client_manager.get_client(request.account_id)
        
        if request.auto_login:
            # 尝试自动登录
            success = await client.login()
            
            if success:
                return LoginResponse(
                    success=True,
                    message="登录成功",
                    account_id=request.account_id,
                )
            else:
                # 需要扫码登录
                # 这里应该生成二维码URL
                return LoginResponse(
                    success=False,
                    message="需要扫码登录",
                    account_id=request.account_id,
                    qrcode_url=f"/api/v1/accounts/{request.account_id}/qrcode",
                )
        else:
            return LoginResponse(
                success=False,
                message="需要手动登录",
                account_id=request.account_id,
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/logout")
async def logout_account(account_id: str):
    """登出账号"""
    try:
        if account_id in client_manager.clients:
            client = client_manager.clients[account_id]
            await client.close()
            del client_manager.clients[account_id]
        
        return {"message": "登出成功"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}/status")
async def get_account_status(account_id: str):
    """获取账号状态"""
    try:
        client = await client_manager.get_client(account_id)
        
        return {
            "account_id": account_id,
            "is_logged_in": client.is_logged_in,
            "is_initialized": client.bot is not None and client.bot.is_running,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/refresh")
async def refresh_account(account_id: str):
    """刷新账号状态"""
    try:
        client = await client_manager.get_client(account_id)
        
        # 检查登录状态
        is_logged_in = await client._check_login_status()
        client.is_logged_in = is_logged_in
        
        return {
            "account_id": account_id,
            "is_logged_in": is_logged_in,
            "message": "刷新成功" if is_logged_in else "需要重新登录",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{account_id}")
async def delete_account(account_id: str):
    """删除账号"""
    try:
        if account_id in client_manager.clients:
            client = client_manager.clients[account_id]
            await client.close()
            del client_manager.clients[account_id]
        
        # 这里还需要删除保存的cookies等数据
        
        return {"message": "删除成功"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}/qrcode")
async def get_qrcode(account_id: str):
    """获取登录二维码"""
    try:
        # 这里需要实现生成二维码的逻辑
        # 可以返回二维码图片或URL
        
        return {
            "account_id": account_id,
            "message": "请实现二维码生成逻辑",
            "qrcode_url": f"https://example.com/qrcode/{account_id}",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/scan-complete")
async def scan_complete(account_id: str):
    """扫码完成回调"""
    try:
        client = await client_manager.get_client(account_id)
        
        # 检查登录状态
        is_logged_in = await client._check_login_status()
        client.is_logged_in = is_logged_in
        
        return {
            "account_id": account_id,
            "success": is_logged_in,
            "message": "登录成功" if is_logged_in else "登录失败",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))