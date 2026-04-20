from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class KuaishouConfig(BaseModel):
    """快手配置"""
    app_key: str = Field(..., description="应用AppKey")
    app_secret: str = Field(..., description="应用AppSecret")
    access_token: Optional[str] = Field(None, description="访问令牌")
    refresh_token: Optional[str] = Field(None, description="刷新令牌")
    token_expires_at: Optional[datetime] = Field(None, description="令牌过期时间")
    shop_id: Optional[str] = Field(None, description="店铺ID")


class ProductInfo(BaseModel):
    """商品信息"""
    product_id: str = Field(..., description="商品ID")
    title: str = Field(..., description="商品标题")
    description: Optional[str] = Field(None, description="商品描述")
    price: float = Field(..., description="价格，单位：分")
    stock: int = Field(0, description="库存数量")
    status: int = Field(1, description="商品状态：1-上架，0-下架")
    category_id: Optional[int] = Field(None, description="分类ID")
    images: List[str] = Field(default_factory=list, description="商品图片列表")
    skus: List[Dict[str, Any]] = Field(default_factory=list, description="SKU列表")
    create_time: Optional[datetime] = Field(None, description="创建时间")
    update_time: Optional[datetime] = Field(None, description="更新时间")


class OrderInfo(BaseModel):
    """订单信息"""
    order_id: str = Field(..., description="订单ID")
    order_status: int = Field(..., description="订单状态")
    pay_amount: float = Field(0, description="支付金额，单位：分")
    total_amount: float = Field(0, description="总金额，单位：分")
    create_time: datetime = Field(..., description="创建时间")
    pay_time: Optional[datetime] = Field(None, description="支付时间")
    buyer_message: Optional[str] = Field(None, description="买家留言")
    receiver_name: Optional[str] = Field(None, description="收货人姓名")
    receiver_phone: Optional[str] = Field(None, description="收货人电话")
    receiver_address: Optional[str] = Field(None, description="收货地址")
    items: List[Dict[str, Any]] = Field(default_factory=list, description="订单商品列表")


class InventoryUpdate(BaseModel):
    """库存更新"""
    product_id: str = Field(..., description="商品ID")
    sku_id: Optional[str] = Field(None, description="SKU ID")
    quantity: int = Field(..., description="库存数量")
    update_type: int = Field(1, description="更新类型：1-设置，2-增加，3-减少")


class InventoryResponse(BaseModel):
    """库存更新响应"""
    success: bool = Field(..., description="是否成功")
    product_id: str = Field(..., description="商品ID")
    sku_id: Optional[str] = Field(None, description="SKU ID")
    new_quantity: Optional[int] = Field(None, description="新库存数量")
    message: Optional[str] = Field(None, description="响应消息")


class LogisticsInfo(BaseModel):
    """物流信息"""
    order_id: str = Field(..., description="订单ID")
    company_code: str = Field(..., description="快递公司代码")
    tracking_number: str = Field(..., description="快递单号")
    receiver_info: Optional[Dict[str, Any]] = Field(None, description="收货人信息")
    status: Optional[int] = Field(None, description="物流状态")


class ApiResponse(BaseModel):
    """通用API响应"""
    code: int = Field(0, description="响应码")
    message: str = Field("success", description="响应消息")
    data: Optional[Any] = Field(None, description="响应数据")
    request_id: Optional[str] = Field(None, description="请求ID")


class PaginatedResponse(BaseModel):
    """分页响应"""
    items: List[Any] = Field(default_factory=list, description="数据列表")
    total: int = Field(0, description="总数")
    page: int = Field(1, description="当前页码")
    page_size: int = Field(20, description="每页数量")
    has_more: bool = Field(False, description="是否有更多数据")