import time
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx
from loguru import logger
from models import (
    KuaishouConfig, ProductInfo, OrderInfo, InventoryUpdate,
    LogisticsInfo, ApiResponse, PaginatedResponse
)
from auth import KuaishouAuthManager


class KuaishouClient:
    """快手开放平台API客户端"""
    
    # 快手开放平台API基础URL（需要根据实际API文档确认）
    BASE_URL = "https://open.kuaishou.com"
    
    # API端点（需要根据实际API文档确认）
    API_ENDPOINTS = {
        # 商品API
        "product_list": "/api/product/list",
        "product_detail": "/api/product/detail",
        
        # 订单API
        "order_list": "/api/order/list",
        "order_detail": "/api/order/detail",
        
        # 库存API
        "stock_update": "/api/stock/update",
        
        # 物流API
        "logistics_send": "/api/logistics/send",
    }
    
    def __init__(self, auth_manager: KuaishouAuthManager):
        self.auth_manager = auth_manager
        self.config = auth_manager.config
        self.client = httpx.AsyncClient(timeout=60.0)
    
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
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """发送API请求
        
        Args:
            method: HTTP方法
            endpoint: API端点
            params: 查询参数
            data: 请求体数据
            
        Returns:
            API响应数据
        """
        # 确保token有效
        access_token = await self.auth_manager.ensure_valid_token()
        
        # 准备请求参数
        request_params = params or {}
        request_params["access_token"] = access_token
        
        # 添加公共参数和签名
        request_params = self._add_common_params(request_params)
        
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = await self.client.get(url, params=request_params)
            else:
                response = await self.client.post(
                    url,
                    params=request_params,
                    json=data,
                    headers={"Content-Type": "application/json"}
                )
            
            response.raise_for_status()
            result = response.json()
            
            # 检查响应（快手成功状态码需要确认）
            if result.get("result") != 1:
                logger.error(f"API请求失败: {result}")
                raise Exception(f"API请求失败: {result.get('error_msg', '未知错误')}")
            
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP错误: {e}")
            raise Exception(f"HTTP请求失败: {e}")
        except Exception as e:
            logger.error(f"请求异常: {e}")
            raise
    
    # ==================== 商品API ====================
    
    async def get_product_list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[int] = None,
        search_word: Optional[str] = None
    ) -> PaginatedResponse:
        """获取商品列表
        
        Args:
            page: 页码
            page_size: 每页数量
            status: 商品状态筛选
            search_word: 搜索关键词
            
        Returns:
            分页商品列表
        """
        params = {
            "page": page,
            "page_size": page_size,
        }
        
        if status is not None:
            params["status"] = status
        if search_word:
            params["search_word"] = search_word
        
        result = await self._request("GET", self.API_ENDPOINTS["product_list"], params=params)
        
        data = result.get("data", {})
        products = [
            ProductInfo(
                product_id=item.get("product_id"),
                title=item.get("title", ""),
                description=item.get("description"),
                price=item.get("price", 0),
                stock=item.get("stock", 0),
                status=item.get("status", 1),
                category_id=item.get("category_id"),
                images=item.get("images", []),
                skus=item.get("skus", []),
                create_time=item.get("create_time"),
                update_time=item.get("update_time")
            )
            for item in data.get("list", [])
        ]
        
        return PaginatedResponse(
            items=products,
            total=data.get("total", 0),
            page=page,
            page_size=page_size,
            has_more=data.get("has_more", False)
        )
    
    async def get_product_detail(self, product_id: str) -> ProductInfo:
        """获取商品详情
        
        Args:
            product_id: 商品ID
            
        Returns:
            商品详情
        """
        params = {"product_id": product_id}
        result = await self._request("GET", self.API_ENDPOINTS["product_detail"], params=params)
        
        data = result.get("data", {})
        return ProductInfo(
            product_id=data.get("product_id"),
            title=data.get("title", ""),
            description=data.get("description"),
            price=data.get("price", 0),
            stock=data.get("stock", 0),
            status=data.get("status", 1),
            category_id=data.get("category_id"),
            images=data.get("images", []),
            skus=data.get("skus", []),
            create_time=data.get("create_time"),
            update_time=data.get("update_time")
        )
    
    # ==================== 订单API ====================
    
    async def get_order_list(
        self,
        page: int = 1,
        page_size: int = 20,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        order_status: Optional[int] = None
    ) -> PaginatedResponse:
        """获取订单列表
        
        Args:
            page: 页码
            page_size: 每页数量
            start_time: 开始时间
            end_time: 结束时间
            order_status: 订单状态
            
        Returns:
            分页订单列表
        """
        params = {
            "page": page,
            "page_size": page_size,
        }
        
        if start_time:
            params["start_time"] = start_time
        if end_time:
            params["end_time"] = end_time
        if order_status is not None:
            params["order_status"] = order_status
        
        result = await self._request("GET", self.API_ENDPOINTS["order_list"], params=params)
        
        data = result.get("data", {})
        orders = [
            OrderInfo(
                order_id=item.get("order_id"),
                order_status=item.get("order_status", 0),
                pay_amount=item.get("pay_amount", 0),
                total_amount=item.get("total_amount", 0),
                create_time=item.get("create_time"),
                pay_time=item.get("pay_time"),
                buyer_message=item.get("buyer_message"),
                receiver_name=item.get("receiver_name"),
                receiver_phone=item.get("receiver_phone"),
                receiver_address=item.get("receiver_address"),
                items=item.get("items", [])
            )
            for item in data.get("list", [])
        ]
        
        return PaginatedResponse(
            items=orders,
            total=data.get("total", 0),
            page=page,
            page_size=page_size,
            has_more=data.get("has_more", False)
        )
    
    async def get_order_detail(self, order_id: str) -> OrderInfo:
        """获取订单详情
        
        Args:
            order_id: 订单ID
            
        Returns:
            订单详情
        """
        params = {"order_id": order_id}
        result = await self._request("GET", self.API_ENDPOINTS["order_detail"], params=params)
        
        data = result.get("data", {})
        return OrderInfo(
            order_id=data.get("order_id"),
            order_status=data.get("order_status", 0),
            pay_amount=data.get("pay_amount", 0),
            total_amount=data.get("total_amount", 0),
            create_time=data.get("create_time"),
            pay_time=data.get("pay_time"),
            buyer_message=data.get("buyer_message"),
            receiver_name=data.get("receiver_name"),
            receiver_phone=data.get("receiver_phone"),
            receiver_address=data.get("receiver_address"),
            items=data.get("items", [])
        )
    
    # ==================== 库存API ====================
    
    async def update_stock(self, update: InventoryUpdate) -> Dict[str, Any]:
        """更新库存
        
        Args:
            update: 库存更新信息
            
        Returns:
            更新结果
        """
        data = {
            "product_id": update.product_id,
            "quantity": update.quantity,
            "update_type": update.update_type,
        }
        
        if update.sku_id:
            data["sku_id"] = update.sku_id
        
        result = await self._request("POST", self.API_ENDPOINTS["stock_update"], data=data)
        return result.get("data", {})
    
    # ==================== 物流API ====================
    
    async def send_logistics(self, logistics: LogisticsInfo) -> Dict[str, Any]:
        """发货
        
        Args:
            logistics: 物流信息
            
        Returns:
            发货结果
        """
        data = {
            "order_id": logistics.order_id,
            "company_code": logistics.company_code,
            "tracking_number": logistics.tracking_number,
        }
        
        if logistics.receiver_info:
            data["receiver_info"] = logistics.receiver_info
        
        result = await self._request("POST", self.API_ENDPOINTS["logistics_send"], data=data)
        return result.get("data", {})
    
    async def close(self):
        """关闭客户端"""
        await self.client.aclose()


# 全局客户端实例
_client: Optional[KuaishouClient] = None


def get_kuaishou_client() -> KuaishouClient:
    """获取快手客户端实例"""
    global _client
    if _client is None:
        from auth import get_auth_manager
        auth_manager = get_auth_manager()
        _client = KuaishouClient(auth_manager)
    return _client


def init_kuaishou_client(auth_manager: KuaishouAuthManager) -> KuaishouClient:
    """初始化快手客户端"""
    global _client
    _client = KuaishouClient(auth_manager)
    return _client