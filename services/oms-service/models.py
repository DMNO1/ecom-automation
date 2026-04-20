from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Platform(str, Enum):
    """电商平台枚举"""
    DOUYIN = "douyin"  # 抖音
    KUAISHOU = "kuaishou"  # 快手
    PINDUODUO = "pinduoduo"  # 拼多多
    XIANYU = "xianyu"  # 闲鱼


class OrderStatus(str, Enum):
    """订单状态枚举"""
    PENDING = "pending"  # 待处理
    PROCESSING = "processing"  # 处理中
    SHIPPED = "shipped"  # 已发货
    DELIVERED = "delivered"  # 已送达
    COMPLETED = "completed"  # 已完成
    CANCELLED = "cancelled"  # 已取消
    REFUNDING = "refunding"  # 退款中
    REFUNDED = "refunded"  # 已退款


class PaymentStatus(str, Enum):
    """支付状态枚举"""
    UNPAID = "unpaid"  # 未支付
    PAID = "paid"  # 已支付
    PARTIAL_REFUND = "partial_refund"  # 部分退款
    FULL_REFUND = "full_refund"  # 全额退款


class TicketStatus(str, Enum):
    """工单状态枚举"""
    OPEN = "open"  # 待处理
    IN_PROGRESS = "in_progress"  # 处理中
    RESOLVED = "resolved"  # 已解决
    CLOSED = "closed"  # 已关闭


class TicketType(str, Enum):
    """工单类型枚举"""
    REFUND = "refund"  # 退款
    EXCHANGE = "exchange"  # 换货
    RETURN = "return"  # 退货
    COMPLAINT = "complaint"  # 投诉
    INQUIRY = "inquiry"  # 咨询


class RiskLevel(str, Enum):
    """风险等级枚举"""
    LOW = "low"  # 低风险
    MEDIUM = "medium"  # 中风险
    HIGH = "high"  # 高风险
    CRITICAL = "critical"  # 高危


class OrderItem(BaseModel):
    """订单商品项"""
    sku_id: str = Field(..., description="SKU ID")
    product_name: str = Field(..., description="商品名称")
    quantity: int = Field(..., gt=0, description="数量")
    unit_price: float = Field(..., ge=0, description="单价")
    total_price: float = Field(..., ge=0, description="总价")
    specifications: Optional[Dict[str, Any]] = Field(None, description="规格参数")


class ShippingInfo(BaseModel):
    """物流信息"""
    carrier: str = Field(..., description="承运商")
    tracking_number: Optional[str] = Field(None, description="运单号")
    shipping_method: str = Field(..., description="配送方式")
    estimated_delivery: Optional[datetime] = Field(None, description="预计送达时间")
    actual_delivery: Optional[datetime] = Field(None, description="实际送达时间")


class CustomerInfo(BaseModel):
    """客户信息"""
    customer_id: str = Field(..., description="客户ID")
    name: str = Field(..., description="客户姓名")
    phone: str = Field(..., description="联系电话")
    address: str = Field(..., description="收货地址")
    platform_uid: str = Field(..., description="平台用户ID")


class PaymentInfo(BaseModel):
    """支付信息"""
    payment_method: str = Field(..., description="支付方式")
    transaction_id: Optional[str] = Field(None, description="交易流水号")
    payment_time: Optional[datetime] = Field(None, description="支付时间")
    amount: float = Field(..., ge=0, description="支付金额")
    currency: str = Field("CNY", description="货币类型")


class Order(BaseModel):
    """订单模型"""
    order_id: str = Field(..., description="订单ID")
    platform: Platform = Field(..., description="来源平台")
    platform_order_id: str = Field(..., description="平台订单号")
    status: OrderStatus = Field(OrderStatus.PENDING, description="订单状态")
    payment_status: PaymentStatus = Field(PaymentStatus.UNPAID, description="支付状态")
    
    # 订单详情
    items: List[OrderItem] = Field(..., description="订单商品列表")
    total_amount: float = Field(..., ge=0, description="订单总金额")
    discount_amount: float = Field(0, ge=0, description="优惠金额")
    actual_amount: float = Field(..., ge=0, description="实付金额")
    
    # 客户和物流信息
    customer: CustomerInfo = Field(..., description="客户信息")
    shipping: Optional[ShippingInfo] = Field(None, description="物流信息")
    payment: Optional[PaymentInfo] = Field(None, description="支付信息")
    
    # 时间信息
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")
    paid_at: Optional[datetime] = Field(None, description="支付时间")
    shipped_at: Optional[datetime] = Field(None, description="发货时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    
    # 扩展字段
    remarks: Optional[str] = Field(None, description="备注")
    tags: List[str] = Field(default_factory=list, description="标签")
    risk_level: RiskLevel = Field(RiskLevel.LOW, description="风险等级")
    metadata: Optional[Dict[str, Any]] = Field(None, description="元数据")


class InventoryItem(BaseModel):
    """库存项目模型"""
    sku_id: str = Field(..., description="SKU ID")
    product_name: str = Field(..., description="商品名称")
    platform: Platform = Field(..., description="所属平台")
    
    # 库存信息
    total_stock: int = Field(0, ge=0, description="总库存")
    available_stock: int = Field(0, ge=0, description="可用库存")
    locked_stock: int = Field(0, ge=0, description="锁定库存")
    in_transit_stock: int = Field(0, ge=0, description="在途库存")
    
    # 预警设置
    min_stock_alert: int = Field(10, ge=0, description="最低库存预警")
    max_stock_alert: int = Field(1000, ge=0, description="最高库存预警")
    
    # 风险标签
    risk_tags: List[str] = Field(default_factory=list, description="风险标签")
    risk_level: RiskLevel = Field(RiskLevel.LOW, description="风险等级")
    
    # 时间信息
    last_updated: datetime = Field(default_factory=datetime.now, description="最后更新时间")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    
    # 扩展信息
    category: Optional[str] = Field(None, description="商品分类")
    supplier: Optional[str] = Field(None, description="供应商")
    cost_price: Optional[float] = Field(None, ge=0, description="成本价")
    sale_price: Optional[float] = Field(None, ge=0, description="销售价")


class Ticket(BaseModel):
    """工单模型"""
    ticket_id: str = Field(..., description="工单ID")
    order_id: str = Field(..., description="关联订单ID")
    platform: Platform = Field(..., description="来源平台")
    
    # 工单详情
    ticket_type: TicketType = Field(..., description="工单类型")
    status: TicketStatus = Field(TicketStatus.OPEN, description="工单状态")
    priority: int = Field(3, ge=1, le=5, description="优先级(1-5)")
    
    # 问题描述
    title: str = Field(..., description="工单标题")
    description: str = Field(..., description="问题描述")
    customer_complaint: Optional[str] = Field(None, description="客户投诉内容")
    
    # 处理信息
    assigned_to: Optional[str] = Field(None, description="处理人")
    resolution: Optional[str] = Field(None, description="解决方案")
    resolution_time: Optional[datetime] = Field(None, description="解决时间")
    
    # 退款信息（如果是退款工单）
    refund_amount: Optional[float] = Field(None, ge=0, description="退款金额")
    refund_reason: Optional[str] = Field(None, description="退款原因")
    refund_status: Optional[str] = Field(None, description="退款状态")
    
    # 时间信息
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")
    due_date: Optional[datetime] = Field(None, description="截止时间")
    
    # 扩展字段
    attachments: List[str] = Field(default_factory=list, description="附件列表")
    tags: List[str] = Field(default_factory=list, description="标签")
    metadata: Optional[Dict[str, Any]] = Field(None, description="元数据")


class DashboardStats(BaseModel):
    """运营看板统计数据"""
    total_orders: int = Field(0, description="总订单数")
    pending_orders: int = Field(0, description="待处理订单数")
    processing_orders: int = Field(0, description="处理中订单数")
    completed_orders: int = Field(0, description="已完成订单数")
    
    total_revenue: float = Field(0, description="总收入")
    today_revenue: float = Field(0, description="今日收入")
    
    total_tickets: int = Field(0, description="总工单数")
    open_tickets: int = Field(0, description="待处理工单数")
    resolved_tickets: int = Field(0, description="已解决工单数")
    
    low_stock_items: int = Field(0, description="低库存商品数")
    high_risk_items: int = Field(0, description="高风险商品数")
    
    platform_stats: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="平台统计")
    recent_orders: List[Order] = Field(default_factory=list, description="最近订单")
    recent_tickets: List[Ticket] = Field(default_factory=list, description="最近工单")
