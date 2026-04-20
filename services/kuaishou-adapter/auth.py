import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from loguru import logger
import httpx
from pydantic_settings import BaseSettings
from models import KuaishouConfig


class KuaishouAuthManager:
    """快手授权管理器"""
    
    # 快手开放平台API基础URL（需要根据实际API文档确认）
    BASE_URL = "https://open.kuaishou.com"
    
    # API端点（需要根据实际API文档确认）
    TOKEN_URL = "/oauth2/access_token"
    REFRESH_TOKEN_URL = "/oauth2/refresh_token"
    
    def __init__(self, config: KuaishouConfig):
        self.config = config
        self._token_lock = False
    
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """生成签名
        
        快手签名规则：将参数按key排序，拼接成字符串，加上app_secret，进行MD5
        （具体签名规则需要参考快手API文档）
        """
        import hashlib
        
        # 过滤掉sign参数
        filtered_params = {k: v for k, v in params.items() if k != "sign" and v is not None}
        
        # 按key排序
        sorted_keys = sorted(filtered_params.keys())
        
        # 拼接参数
        param_str = ""
        for key in sorted_keys:
            param_str += f"{key}{filtered_params[key]}"
        
        # 加上app_secret
        param_str += self.config.app_secret
        
        # MD5加密
        return hashlib.md5(param_str.encode('utf-8')).hexdigest()
    
    def _add_common_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """添加公共参数"""
        common_params = {
            "app_key": self.config.app_key,
            "timestamp": str(int(time.time())),
            "v": "1.0",
            "format": "json",
        }
        params.update(common_params)
        
        # 生成签名
        params["sign"] = self._generate_sign(params)
        
        return params
    
    async def get_access_token(self, auth_code: str) -> Dict[str, Any]:
        """使用授权码获取access_token
        
        Args:
            auth_code: 授权码
            
        Returns:
            包含token信息的字典
        """
        try:
            params = {
                "app_key": self.config.app_key,
                "app_secret": self.config.app_secret,
                "grant_type": "authorization_code",
                "code": auth_code,
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}{self.TOKEN_URL}",
                    data=params,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
            
            if result.get("result") == 1:  # 快手成功状态码（需要确认）
                data = result.get("data", {})
                self.config.access_token = data.get("access_token")
                self.config.refresh_token = data.get("refresh_token")
                self.config.token_expires_at = datetime.now() + timedelta(
                    seconds=data.get("expires_in", 7200)
                )
                self.config.shop_id = data.get("shop_id")
                
                logger.info(f"获取access_token成功，店铺ID: {self.config.shop_id}")
                return data
            else:
                logger.error(f"获取access_token失败: {result}")
                raise Exception(f"获取token失败: {result.get('error_msg', '未知错误')}")
                
        except Exception as e:
            logger.error(f"获取access_token异常: {e}")
            raise
    
    async def refresh_access_token(self) -> Dict[str, Any]:
        """刷新access_token
        
        Returns:
            包含新token信息的字典
        """
        if not self.config.refresh_token:
            raise Exception("没有refresh_token，无法刷新")
        
        try:
            params = {
                "app_key": self.config.app_key,
                "app_secret": self.config.app_secret,
                "grant_type": "refresh_token",
                "refresh_token": self.config.refresh_token,
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}{self.REFRESH_TOKEN_URL}",
                    data=params,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
            
            if result.get("result") == 1:  # 快手成功状态码（需要确认）
                data = result.get("data", {})
                self.config.access_token = data.get("access_token")
                self.config.refresh_token = data.get("refresh_token")
                self.config.token_expires_at = datetime.now() + timedelta(
                    seconds=data.get("expires_in", 7200)
                )
                
                logger.info("刷新access_token成功")
                return data
            else:
                logger.error(f"刷新access_token失败: {result}")
                raise Exception(f"刷新token失败: {result.get('error_msg', '未知错误')}")
                
        except Exception as e:
            logger.error(f"刷新access_token异常: {e}")
            raise
    
    async def ensure_valid_token(self) -> str:
        """确保有有效的access_token
        
        Returns:
            有效的access_token
        """
        # 检查token是否存在
        if not self.config.access_token:
            raise Exception("没有access_token，请先进行授权")
        
        # 检查token是否过期（提前5分钟刷新）
        if self.config.token_expires_at:
            if datetime.now() >= self.config.token_expires_at - timedelta(minutes=5):
                logger.info("access_token即将过期，自动刷新")
                await self.refresh_access_token()
        
        return self.config.access_token
    
    def get_auth_url(self, redirect_uri: str, state: str = "") -> str:
        """生成授权URL
        
        Args:
            redirect_uri: 授权回调地址
            state: 自定义参数
            
        Returns:
            授权URL
        """
        # 快手授权URL（需要根据实际API文档确认）
        auth_base_url = "https://open.kuaishou.com/oauth2/authorize"
        
        params = {
            "app_key": self.config.app_key,
            "redirect_uri": redirect_uri,
            "state": state,
            "response_type": "code",
        }
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{auth_base_url}?{param_str}"


# 全局配置实例
_config: Optional[KuaishouConfig] = None
_auth_manager: Optional[KuaishouAuthManager] = None


def get_auth_manager() -> KuaishouAuthManager:
    """获取授权管理器实例"""
    global _auth_manager
    if _auth_manager is None:
        raise Exception("授权管理器未初始化")
    return _auth_manager


def init_auth_manager(config: KuaishouConfig) -> KuaishouAuthManager:
    """初始化授权管理器"""
    global _config, _auth_manager
    _config = config
    _auth_manager = KuaishouAuthManager(config)
    return _auth_manager