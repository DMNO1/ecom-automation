"""
拼多多API客户端
基于拼多多开放平台API封装
"""
import time
import hashlib
import json
import logging
from typing import Dict, Any, Optional
import httpx

# 导入配置
try:
    from .config import settings
except ImportError:
    # 当直接运行时
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from config import settings

logger = logging.getLogger(__name__)


class PDDClient:
    """拼多多开放平台API客户端"""
    
    def __init__(self):
        self.client_id = settings.PDD_CLIENT_ID
        self.client_secret = settings.PDD_CLIENT_SECRET
        self.access_token = settings.PDD_ACCESS_TOKEN
        self.base_url = settings.PDD_API_BASE_URL
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """生成API签名"""
        # 拼多多签名算法：将参数按key排序后拼接，加上client_secret，进行MD5
        sorted_params = sorted(params.items())
        sign_str = self.client_secret
        for key, value in sorted_params:
            sign_str += f"{key}{value}"
        sign_str += self.client_secret
        
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest().upper()
    
    async def _request(self, method_name: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """通用API请求方法"""
        if params is None:
            params = {}
        
        # 基础参数
        base_params = {
            "type": method_name,
            "client_id": self.client_id,
            "timestamp": str(int(time.time())),
            "data_type": "JSON",
            "version": "1.0"
        }
        
        # 合并参数
        request_params = {**base_params, **params}
        
        # 生成签名
        sign = self._generate_sign(request_params)
        request_params["sign"] = sign
        
        try:
            response = await self.client.post(
                self.base_url,
                data=request_params,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            result = response.json()
            
            # 检查错误响应
            if "error_response" in result:
                error = result["error_response"]
                logger.error(f"API错误: {error}")
                raise Exception(f"拼多多API错误: {error.get('error_msg', '未知错误')}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP请求错误: {e}")
            raise
        except Exception as e:
            logger.error(f"请求异常: {e}")
            raise
    
    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """获取access_token"""
        params = {
            "code": code,
            "grant_type": "authorization_code"
        }
        return await self._request("pdd.pop.auth.token.create", params)
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """刷新access_token"""
        params = {
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        return await self._request("pdd.pop.auth.token.refresh", params)
    
    async def get_conversation_list(self) -> Dict[str, Any]:
        """获取会话列表"""
        params = {}
        if self.access_token:
            params["access_token"] = self.access_token
        return await self._request("pdd.pop.chat.conversation.list", params)
    
    async def get_chat_messages(self, conversation_id: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """获取聊天消息"""
        params = {
            "conversation_id": conversation_id,
            "page": page,
            "page_size": page_size
        }
        if self.access_token:
            params["access_token"] = self.access_token
        return await self._request("pdd.pop.chat.message.list", params)
    
    async def send_message(self, conversation_id: str, content: str, msg_type: int = 1) -> Dict[str, Any]:
        """发送消息
        msg_type: 1-文本, 2-图片, 3-商品卡片
        """
        params = {
            "conversation_id": conversation_id,
            "content": content,
            "msg_type": msg_type
        }
        if self.access_token:
            params["access_token"] = self.access_token
        return await self._request("pdd.pop.chat.message.send", params)
    
    async def get_order_detail(self, order_sn: str) -> Dict[str, Any]:
        """获取订单详情"""
        params = {
            "order_sn": order_sn
        }
        if self.access_token:
            params["access_token"] = self.access_token
        return await self._request("pdd.order.detail.get", params)
    
    async def get_logistics_info(self, order_sn: str) -> Dict[str, Any]:
        """获取物流信息"""
        params = {
            "order_sn": order_sn
        }
        if self.access_token:
            params["access_token"] = self.access_token
        return await self._request("pdd.logistics.online.send", params)
    
    async def close(self):
        """关闭客户端"""
        await self.client.aclose()


# 创建全局客户端实例（可选）
pdd_client = PDDClient()
