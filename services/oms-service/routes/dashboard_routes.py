from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from models import DashboardStats, Order, Ticket, Platform
from order_manager import OrderManager
from inventory_manager import InventoryManager
from ticket_manager import TicketManager

router = APIRouter()
order_manager = OrderManager()
inventory_manager = InventoryManager()
ticket_manager = TicketManager()


@router.get("/", response_model=DashboardStats, summary="获取运营看板数据")
async def get_dashboard_stats():
    """获取统一运营看板源数据"""
    # 获取订单统计
    order_stats = order_manager.get_order_statistics()
    
    # 获取库存统计
    inventory_stats = inventory_manager.get_inventory_statistics()
    
    # 获取工单统计
    ticket_stats = ticket_manager.get_ticket_statistics()
    
    # 获取最近订单和工单
    recent_orders = order_manager.get_recent_orders(5)
    recent_tickets = ticket_manager.get_recent_tickets(5)
    
    # 按平台统计
    platform_stats = {}
    for platform in Platform:
        platform_orders = order_manager.get_orders_by_platform(platform)
        platform_tickets = ticket_manager.get_tickets_by_platform(platform)
        
        platform_stats[platform.value] = {
            "order_count": len(platform_orders),
            "ticket_count": len(platform_tickets),
            "total_revenue": sum(o.actual_amount for o in platform_orders),
            "pending_orders": len([o for o in platform_orders if o.status.value == "pending"]),
            "open_tickets": len([t for t in platform_tickets if t.status.value == "open"])
        }
    
    # 计算今日收入
    today = datetime.now().date()
    today_orders = [o for o in order_manager.get_all_orders() 
                   if o.created_at.date() == today]
    today_revenue = sum(o.actual_amount for o in today_orders)
    
    return DashboardStats(
        total_orders=order_stats["total_orders"],
        pending_orders=order_stats["status_counts"].get("pending", 0),
        processing_orders=order_stats["status_counts"].get("processing", 0),
        completed_orders=order_stats["status_counts"].get("completed", 0),
        total_revenue=order_stats["total_revenue"],
        today_revenue=today_revenue,
        total_tickets=ticket_stats["total_tickets"],
        open_tickets=ticket_stats["status_counts"].get("open", 0),
        resolved_tickets=ticket_stats["status_counts"].get("resolved", 0),
        low_stock_items=inventory_stats["low_stock_count"],
        high_risk_items=inventory_stats["high_risk_count"],
        platform_stats=platform_stats,
        recent_orders=recent_orders,
        recent_tickets=recent_tickets
    )


@router.get("/overview", summary="获取概览数据")
async def get_overview():
    """获取概览数据"""
    order_stats = order_manager.get_order_statistics()
    inventory_stats = inventory_manager.get_inventory_statistics()
    ticket_stats = ticket_manager.get_ticket_statistics()
    
    # 计算关键指标
    completion_rate = 0
    if order_stats["total_orders"] > 0:
        completion_rate = round(
            order_stats["status_counts"].get("completed", 0) / order_stats["total_orders"] * 100, 2
        )
    
    resolution_rate = 0
    if ticket_stats["total_tickets"] > 0:
        resolution_rate = round(
            (ticket_stats["status_counts"].get("resolved", 0) + 
             ticket_stats["status_counts"].get("closed", 0)) / ticket_stats["total_tickets"] * 100, 2
        )
    
    return {
        "orders": {
            "total": order_stats["total_orders"],
            "pending": order_stats["status_counts"].get("pending", 0),
            "processing": order_stats["status_counts"].get("processing", 0),
            "completed": order_stats["status_counts"].get("completed", 0),
            "completion_rate": completion_rate,
            "total_revenue": order_stats["total_revenue"],
            "average_order_value": order_stats["average_order_value"]
        },
        "inventory": {
            "total_items": inventory_stats["total_items"],
            "total_stock": inventory_stats["total_stock"],
            "available_stock": inventory_stats["available_stock"],
            "low_stock_count": inventory_stats["low_stock_count"],
            "high_risk_count": inventory_stats["high_risk_count"]
        },
        "tickets": {
            "total": ticket_stats["total_tickets"],
            "open": ticket_stats["status_counts"].get("open", 0),
            "in_progress": ticket_stats["status_counts"].get("in_progress", 0),
            "resolved": ticket_stats["status_counts"].get("resolved", 0),
            "resolution_rate": resolution_rate,
            "average_resolution_time": ticket_stats["average_resolution_time"],
            "overdue_count": ticket_stats["overdue_count"]
        }
    }


@router.get("/platform/{platform}", summary="获取指定平台数据")
async def get_platform_data(platform: Platform):
    """获取指定平台的详细数据"""
    # 获取平台订单
    platform_orders = order_manager.get_orders_by_platform(platform)
    
    # 获取平台工单
    platform_tickets = ticket_manager.get_tickets_by_platform(platform)
    
    # 获取平台库存
    platform_inventory = inventory_manager.get_inventory_by_platform(platform)
    
    # 计算平台统计
    total_orders = len(platform_orders)
    total_revenue = sum(o.actual_amount for o in platform_orders)
    pending_orders = len([o for o in platform_orders if o.status.value == "pending"])
    
    total_tickets = len(platform_tickets)
    open_tickets = len([t for t in platform_tickets if t.status.value == "open"])
    
    total_stock = sum(i.total_stock for i in platform_inventory)
    available_stock = sum(i.available_stock for i in platform_inventory)
    
    return {
        "platform": platform.value,
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "total_revenue": total_revenue,
            "recent": platform_orders[:5]  # 最近5个订单
        },
        "tickets": {
            "total": total_tickets,
            "open": open_tickets,
            "recent": platform_tickets[:5]  # 最近5个工单
        },
        "inventory": {
            "total_items": len(platform_inventory),
            "total_stock": total_stock,
            "available_stock": available_stock,
            "low_stock_items": [i for i in platform_inventory if i.available_stock <= i.min_stock_alert]
        }
    }


@router.get("/trends", summary="获取趋势数据")
async def get_trends(days: int = Query(7, ge=1, le=30, description="天数")):
    """获取指定天数的趋势数据"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # 获取日期范围内的订单
    all_orders = order_manager.get_all_orders()
    date_range_orders = [
        o for o in all_orders 
        if start_date <= o.created_at <= end_date
    ]
    
    # 按日期分组统计
    daily_stats = {}
    for i in range(days):
        date = (start_date + timedelta(days=i)).date()
        daily_orders = [o for o in date_range_orders if o.created_at.date() == date]
        
        daily_stats[date.isoformat()] = {
            "order_count": len(daily_orders),
            "revenue": sum(o.actual_amount for o in daily_orders),
            "completed_count": len([o for o in daily_orders if o.status.value == "completed"])
        }
    
    return {
        "period": {
            "start_date": start_date.date().isoformat(),
            "end_date": end_date.date().isoformat(),
            "days": days
        },
        "daily_stats": daily_stats,
        "summary": {
            "total_orders": len(date_range_orders),
            "total_revenue": sum(o.actual_amount for o in date_range_orders),
            "average_daily_orders": round(len(date_range_orders) / days, 2),
            "average_daily_revenue": round(sum(o.actual_amount for o in date_range_orders) / days, 2)
        }
    }


@router.get("/alerts", summary="获取告警信息")
async def get_alerts():
    """获取系统告警信息"""
    alerts = []
    
    # 低库存告警
    low_stock_items = inventory_manager.get_low_stock_items()
    if low_stock_items:
        alerts.append({
            "type": "low_stock",
            "severity": "warning",
            "message": f"有 {len(low_stock_items)} 个商品库存不足",
            "count": len(low_stock_items),
            "items": [i.sku_id for i in low_stock_items[:5]]  # 只显示前5个
        })
    
    # 高风险商品告警
    high_risk_items = inventory_manager.get_high_risk_items()
    if high_risk_items:
        alerts.append({
            "type": "high_risk_inventory",
            "severity": "critical",
            "message": f"有 {len(high_risk_items)} 个高风险商品",
            "count": len(high_risk_items),
            "items": [i.sku_id for i in high_risk_items[:5]]
        })
    
    # 高风险订单告警
    high_risk_orders = order_manager.get_high_risk_orders()
    if high_risk_orders:
        alerts.append({
            "type": "high_risk_orders",
            "severity": "warning",
            "message": f"有 {len(high_risk_orders)} 个高风险订单",
            "count": len(high_risk_orders),
            "items": [o.order_id for o in high_risk_orders[:5]]
        })
    
    # 超时工单告警
    overdue_tickets = ticket_manager.get_overdue_tickets()
    if overdue_tickets:
        alerts.append({
            "type": "overdue_tickets",
            "severity": "critical",
            "message": f"有 {len(overdue_tickets)} 个工单超时",
            "count": len(overdue_tickets),
            "items": [t.ticket_id for t in overdue_tickets[:5]]
        })
    
    # 高优先级工单告警
    high_priority_tickets = ticket_manager.get_high_priority_tickets()
    if high_priority_tickets:
        alerts.append({
            "type": "high_priority_tickets",
            "severity": "warning",
            "message": f"有 {len(high_priority_tickets)} 个高优先级工单待处理",
            "count": len(high_priority_tickets),
            "items": [t.ticket_id for t in high_priority_tickets[:5]]
        })
    
    return {
        "total_alerts": len(alerts),
        "alerts": alerts,
        "generated_at": datetime.now().isoformat()
    }
