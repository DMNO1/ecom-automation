"""
订单管理路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

try:
    from ..xianyu_client import
except ImportError:
    from xianyu_client import client_manager, XianyuOrder
try:
    from ..order_handler import
except ImportError:
    from order_handler import order_handler_registry, ShippingInfo, AutoShipRule

router = APIRouter()


class OrderResponse(BaseModel):
    """订单响应"""
    order_id: str
    product_id: str
    buyer_id: str
    buyer_name: str
    status: str
    amount: float
    created_at: datetime
    updated_at: Optional[datetime]
    tracking_number: Optional[str]


class ShipOrderRequest(BaseModel):
    """发货请求"""
    account_id: str
    order_id: str
    tracking_number: str
    carrier: str = "中通快递"
    shipping_method: str = "标准快递"
    notes: Optional[str] = None


class AutoShipRuleRequest(BaseModel):
    """自动发货规则请求"""
    id: str
    name: str
    product_id: Optional[str] = None
    condition: str = "paid"
    action: str = "virtual_ship"
    delay_minutes: int = 0
    is_active: bool = True


class OrderStatsResponse(BaseModel):
    """订单统计响应"""
    total: int
    pending_payment: int
    paid: int
    shipped: int
    completed: int
    cancelled: int
    total_amount: float
    today_orders: int
    today_amount: float


@router.get("/{account_id}", response_model=List[OrderResponse])
async def get_orders(
    account_id: str,
    status: Optional[str] = Query(None, description="订单状态过滤"),
    force_refresh: bool = Query(False, description="强制刷新"),
):
    """获取订单列表"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        orders = await handler.get_orders(status=status, force_refresh=force_refresh)
        
        return [
            OrderResponse(
                order_id=order.order_id,
                product_id=order.product_id,
                buyer_id=order.buyer_id,
                buyer_name=order.buyer_name,
                status=order.status,
                amount=order.amount,
                created_at=order.created_at,
                updated_at=order.updated_at,
                tracking_number=order.tracking_number,
            )
            for order in orders
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}/{order_id}", response_model=OrderResponse)
async def get_order(account_id: str, order_id: str):
    """获取单个订单"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        order = await handler.get_order(order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        return OrderResponse(
            order_id=order.order_id,
            product_id=order.product_id,
            buyer_id=order.buyer_id,
            buyer_name=order.buyer_name,
            status=order.status,
            amount=order.amount,
            created_at=order.created_at,
            updated_at=order.updated_at,
            tracking_number=order.tracking_number,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ship")
async def ship_order(request: ShipOrderRequest):
    """发货订单"""
    try:
        client = await client_manager.get_client(request.account_id)
        handler = await order_handler_registry.get_handler(request.account_id, client)
        
        shipping_info = ShippingInfo(
            order_id=request.order_id,
            tracking_number=request.tracking_number,
            carrier=request.carrier,
            shipping_method=request.shipping_method,
            notes=request.notes,
        )
        
        success = await handler.ship_order(shipping_info)
        
        if success:
            return {"message": "发货成功"}
        else:
            raise HTTPException(status_code=500, detail="发货失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/auto-ship")
async def trigger_auto_ship(account_id: str):
    """触发自动发货"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        results = await handler.auto_ship_orders()
        
        return {
            "message": "自动发货处理完成",
            "results": results,
            "success_count": sum(1 for success in results.values() if success),
            "total_count": len(results),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/monitoring/start")
async def start_order_monitoring(
    account_id: str,
    interval: int = Query(60, ge=10, le=3600, description="监控间隔（秒）"),
):
    """开始订单监控"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        await handler.start_monitoring(interval=interval)
        
        return {"message": f"订单监控已启动，间隔: {interval}秒"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/monitoring/stop")
async def stop_order_monitoring(account_id: str):
    """停止订单监控"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        await handler.stop_monitoring()
        
        return {"message": "订单监控已停止"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}/stats", response_model=OrderStatsResponse)
async def get_order_stats(account_id: str):
    """获取订单统计"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        stats = await handler.get_order_statistics()
        
        return OrderStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 自动发货规则管理
@router.get("/{account_id}/auto-ship-rules", response_model=List[AutoShipRuleRequest])
async def get_auto_ship_rules(account_id: str):
    """获取自动发货规则"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        rules = await handler.get_auto_ship_rules()
        
        return [
            AutoShipRuleRequest(
                id=rule.id,
                name=rule.name,
                product_id=rule.product_id,
                condition=rule.condition,
                action=rule.action,
                delay_minutes=rule.delay_minutes,
                is_active=rule.is_active,
            )
            for rule in rules
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/auto-ship-rules")
async def add_auto_ship_rule(account_id: str, request: AutoShipRuleRequest):
    """添加自动发货规则"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        rule = AutoShipRule(
            id=request.id,
            name=request.name,
            product_id=request.product_id,
            condition=request.condition,
            action=request.action,
            delay_minutes=request.delay_minutes,
            is_active=request.is_active,
        )
        
        success = await handler.add_auto_ship_rule(rule)
        
        if success:
            return {"message": "规则添加成功"}
        else:
            raise HTTPException(status_code=400, detail="规则添加失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{account_id}/auto-ship-rules/{rule_id}")
async def remove_auto_ship_rule(account_id: str, rule_id: str):
    """删除自动发货规则"""
    try:
        client = await client_manager.get_client(account_id)
        handler = await order_handler_registry.get_handler(account_id, client)
        
        success = await handler.remove_auto_ship_rule(rule_id)
        
        if success:
            return {"message": "规则删除成功"}
        else:
            raise HTTPException(status_code=404, detail="规则不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))