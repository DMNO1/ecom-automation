from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from models import Order, OrderStatus, Platform, PaymentStatus, RiskLevel
from order_manager import OrderManager

router = APIRouter()
order_manager = OrderManager()


@router.get("/", response_model=List[Order], summary="获取所有订单")
async def get_orders(
    platform: Optional[Platform] = Query(None, description="平台筛选"),
    status: Optional[OrderStatus] = Query(None, description="状态筛选"),
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """获取所有订单，支持分页和筛选"""
    orders = order_manager.get_all_orders(
        platform=platform,
        status=status,
        start_date=start_date,
        end_date=end_date
    )
    
    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    return orders[start:end]


@router.get("/statistics", summary="获取订单统计")
async def get_order_statistics():
    """获取订单统计信息"""
    return order_manager.get_order_statistics()


@router.get("/recent", response_model=List[Order], summary="获取最近订单")
async def get_recent_orders(limit: int = Query(10, ge=1, le=50, description="数量限制")):
    """获取最近订单"""
    return order_manager.get_recent_orders(limit)


@router.get("/high-risk", response_model=List[Order], summary="获取高风险订单")
async def get_high_risk_orders():
    """获取高风险订单"""
    return order_manager.get_high_risk_orders()


@router.get("/refunding", response_model=List[Order], summary="获取退款中订单")
async def get_refunding_orders():
    """获取退款中的订单"""
    return order_manager.get_refunding_orders()


@router.get("/search", response_model=List[Order], summary="搜索订单")
async def search_orders(keyword: str = Query(..., description="搜索关键词")):
    """搜索订单"""
    return order_manager.search_orders(keyword)


@router.get("/{order_id}", response_model=Order, summary="获取订单详情")
async def get_order(order_id: str):
    """根据ID获取订单详情"""
    order = order_manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("/", response_model=Order, summary="创建订单")
async def create_order(order_data: dict):
    """创建新订单"""
    try:
        order = order_manager.create_order(order_data)
        return order
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"创建订单失败: {str(e)}")


@router.put("/{order_id}/status", response_model=Order, summary="更新订单状态")
async def update_order_status(order_id: str, status: OrderStatus):
    """更新订单状态"""
    order = order_manager.update_order_status(order_id, status)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.put("/{order_id}/payment-status", response_model=Order, summary="更新支付状态")
async def update_payment_status(order_id: str, payment_status: PaymentStatus):
    """更新支付状态"""
    order = order_manager.update_payment_status(order_id, payment_status)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("/{order_id}/tags", response_model=Order, summary="添加订单标签")
async def add_order_tag(order_id: str, tag: str = Query(..., description="标签内容")):
    """添加订单标签"""
    order = order_manager.add_order_tag(order_id, tag)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.delete("/{order_id}/tags", response_model=Order, summary="移除订单标签")
async def remove_order_tag(order_id: str, tag: str = Query(..., description="标签内容")):
    """移除订单标签"""
    order = order_manager.remove_order_tag(order_id, tag)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.put("/{order_id}/risk-level", response_model=Order, summary="设置订单风险等级")
async def set_order_risk_level(order_id: str, risk_level: RiskLevel):
    """设置订单风险等级"""
    order = order_manager.set_order_risk_level(order_id, risk_level)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.get("/platform/{platform}", response_model=List[Order], summary="获取指定平台订单")
async def get_orders_by_platform(platform: Platform):
    """获取指定平台的订单"""
    return order_manager.get_orders_by_platform(platform)


@router.get("/status/{status}", response_model=List[Order], summary="获取指定状态订单")
async def get_orders_by_status(status: OrderStatus):
    """获取指定状态的订单"""
    return order_manager.get_orders_by_status(status)
