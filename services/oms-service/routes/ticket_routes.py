from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import Ticket, TicketStatus, TicketType, Platform
from ticket_manager import TicketManager

router = APIRouter()
ticket_manager = TicketManager()


@router.get("/", response_model=List[Ticket], summary="获取所有工单")
async def get_tickets(
    platform: Optional[Platform] = Query(None, description="平台筛选"),
    status: Optional[TicketStatus] = Query(None, description="状态筛选"),
    ticket_type: Optional[TicketType] = Query(None, description="类型筛选"),
    priority: Optional[int] = Query(None, ge=1, le=5, description="优先级筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """获取所有工单，支持分页和筛选"""
    tickets = ticket_manager.get_all_tickets(
        platform=platform,
        status=status,
        ticket_type=ticket_type,
        priority=priority
    )
    
    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    return tickets[start:end]


@router.get("/statistics", summary="获取工单统计")
async def get_ticket_statistics():
    """获取工单统计信息"""
    return ticket_manager.get_ticket_statistics()


@router.get("/recent", response_model=List[Ticket], summary="获取最近工单")
async def get_recent_tickets(limit: int = Query(10, ge=1, le=50, description="数量限制")):
    """获取最近工单"""
    return ticket_manager.get_recent_tickets(limit)


@router.get("/open", response_model=List[Ticket], summary="获取待处理工单")
async def get_open_tickets():
    """获取待处理的工单"""
    return ticket_manager.get_open_tickets()


@router.get("/high-priority", response_model=List[Ticket], summary="获取高优先级工单")
async def get_high_priority_tickets():
    """获取高优先级工单（优先级4-5）"""
    return ticket_manager.get_high_priority_tickets()


@router.get("/overdue", response_model=List[Ticket], summary="获取超时工单")
async def get_overdue_tickets():
    """获取超时工单"""
    return ticket_manager.get_overdue_tickets()


@router.get("/refund", response_model=List[Ticket], summary="获取退款工单")
async def get_refund_tickets():
    """获取退款工单"""
    return ticket_manager.get_refund_tickets()


@router.get("/complaint", response_model=List[Ticket], summary="获取投诉工单")
async def get_complaint_tickets():
    """获取投诉工单"""
    return ticket_manager.get_complaint_tickets()


@router.get("/search", response_model=List[Ticket], summary="搜索工单")
async def search_tickets(keyword: str = Query(..., description="搜索关键词")):
    """搜索工单"""
    return ticket_manager.search_tickets(keyword)


@router.get("/{ticket_id}", response_model=Ticket, summary="获取工单详情")
async def get_ticket(ticket_id: str):
    """根据ID获取工单详情"""
    ticket = ticket_manager.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.post("/", response_model=Ticket, summary="创建工单")
async def create_ticket(ticket_data: dict):
    """创建新工单"""
    try:
        ticket = ticket_manager.create_ticket(ticket_data)
        return ticket
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"创建工单失败: {str(e)}")


@router.put("/{ticket_id}/status", response_model=Ticket, summary="更新工单状态")
async def update_ticket_status(ticket_id: str, status: TicketStatus):
    """更新工单状态"""
    ticket = ticket_manager.update_ticket_status(ticket_id, status)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.put("/{ticket_id}/assign", response_model=Ticket, summary="分配工单")
async def assign_ticket(ticket_id: str, assignee: str = Query(..., description="处理人")):
    """分配工单"""
    ticket = ticket_manager.assign_ticket(ticket_id, assignee)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.put("/{ticket_id}/resolve", response_model=Ticket, summary="解决工单")
async def resolve_ticket(ticket_id: str, resolution: str = Query(..., description="解决方案")):
    """解决工单"""
    ticket = ticket_manager.resolve_ticket(ticket_id, resolution)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.put("/{ticket_id}/close", response_model=Ticket, summary="关闭工单")
async def close_ticket(ticket_id: str):
    """关闭工单"""
    ticket = ticket_manager.close_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.put("/{ticket_id}/refund", response_model=Ticket, summary="更新退款信息")
async def update_refund_info(
    ticket_id: str,
    refund_amount: Optional[float] = Query(None, ge=0, description="退款金额"),
    refund_reason: Optional[str] = Query(None, description="退款原因"),
    refund_status: Optional[str] = Query(None, description="退款状态")
):
    """更新退款信息"""
    ticket = ticket_manager.update_refund_info(
        ticket_id,
        refund_amount=refund_amount,
        refund_reason=refund_reason,
        refund_status=refund_status
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.post("/{ticket_id}/tags", response_model=Ticket, summary="添加工单标签")
async def add_ticket_tag(ticket_id: str, tag: str = Query(..., description="标签内容")):
    """添加工单标签"""
    ticket = ticket_manager.add_ticket_tag(ticket_id, tag)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.delete("/{ticket_id}/tags", response_model=Ticket, summary="移除工单标签")
async def remove_ticket_tag(ticket_id: str, tag: str = Query(..., description="标签内容")):
    """移除工单标签"""
    ticket = ticket_manager.remove_ticket_tag(ticket_id, tag)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.put("/{ticket_id}/priority", response_model=Ticket, summary="设置工单优先级")
async def set_priority(ticket_id: str, priority: int = Query(..., ge=1, le=5, description="优先级")):
    """设置工单优先级"""
    ticket = ticket_manager.set_priority(ticket_id, priority)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    return ticket


@router.get("/order/{order_id}", response_model=List[Ticket], summary="获取指定订单工单")
async def get_tickets_by_order(order_id: str):
    """获取指定订单的工单"""
    return ticket_manager.get_tickets_by_order(order_id)


@router.get("/platform/{platform}", response_model=List[Ticket], summary="获取指定平台工单")
async def get_tickets_by_platform(platform: Platform):
    """获取指定平台的工单"""
    return ticket_manager.get_tickets_by_platform(platform)


@router.get("/assignee/{assignee}", response_model=List[Ticket], summary="获取指定处理人工单")
async def get_tickets_by_assignee(assignee: str):
    """获取指定处理人的工单"""
    return ticket_manager.get_tickets_by_assignee(assignee)
