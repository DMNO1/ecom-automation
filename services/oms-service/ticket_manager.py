from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid
from models import Ticket, TicketStatus, TicketType, Platform


class TicketManager:
    """工单管理器"""
    
    def __init__(self):
        # 模拟数据存储 - 实际项目中应使用数据库
        self.tickets: Dict[str, Ticket] = {}
        self._init_sample_data()
    
    def _init_sample_data(self):
        """初始化示例数据"""
        sample_tickets = [
            Ticket(
                ticket_id="TKT-2024-001",
                order_id="ORD-2024-003",
                platform=Platform.PINDUODUO,
                ticket_type=TicketType.REFUND,
                status=TicketStatus.OPEN,
                priority=4,
                title="蓝牙耳机质量问题退款",
                description="客户反映耳机有杂音，要求退款",
                customer_complaint="耳机右耳有电流声，无法正常使用",
                refund_amount=149.0,
                refund_reason="商品质量问题",
                refund_status="待处理",
                created_at=datetime.now() - timedelta(hours=6),
                updated_at=datetime.now(),
                due_date=datetime.now() + timedelta(days=2),
                tags=["质量问题", "退款"],
                assigned_to="客服A"
            ),
            Ticket(
                ticket_id="TKT-2024-002",
                order_id="ORD-2024-001",
                platform=Platform.DOUYIN,
                ticket_type=TicketType.EXCHANGE,
                status=TicketStatus.IN_PROGRESS,
                priority=3,
                title="T恤尺码不合适换货",
                description="客户购买的L码T恤偏小，要求换XL码",
                customer_complaint="衣服尺码偏小，穿着不舒服",
                created_at=datetime.now() - timedelta(days=1),
                updated_at=datetime.now(),
                due_date=datetime.now() + timedelta(days=3),
                tags=["尺码问题", "换货"],
                assigned_to="客服B"
            ),
            Ticket(
                ticket_id="TKT-2024-003",
                order_id="ORD-2024-002",
                platform=Platform.KUAISHOU,
                ticket_type=TicketType.INQUIRY,
                status=TicketStatus.RESOLVED,
                priority=2,
                title="物流查询",
                description="客户查询订单物流状态",
                customer_complaint="我的订单发货了吗？什么时候能到？",
                resolution="已告知客户物流单号和预计送达时间",
                resolution_time=datetime.now() - timedelta(hours=2),
                created_at=datetime.now() - timedelta(days=2),
                updated_at=datetime.now() - timedelta(hours=2),
                tags=["物流咨询"],
                assigned_to="客服C"
            ),
            Ticket(
                ticket_id="TKT-2024-004",
                order_id="ORD-2024-004",
                platform=Platform.XIANYU,
                ticket_type=TicketType.COMPLAINT,
                status=TicketStatus.OPEN,
                priority=5,
                title="二手手机与描述不符",
                description="客户收到的手机与商品描述不符，存在划痕",
                customer_complaint="手机屏幕有裂痕，卖家说是9成新，实际最多6成新！",
                created_at=datetime.now() - timedelta(hours=12),
                updated_at=datetime.now(),
                due_date=datetime.now() + timedelta(days=1),
                tags=["虚假描述", "高优先级"],
                assigned_to="主管D"
            ),
            Ticket(
                ticket_id="TKT-2024-005",
                order_id="ORD-2024-005",
                platform=Platform.PINDUODUO,
                ticket_type=TicketType.RETURN,
                status=TicketStatus.CLOSED,
                priority=3,
                title="商品退货",
                description="客户不喜欢商品颜色，要求退货",
                customer_complaint="颜色和图片差距太大",
                resolution="已同意退货，客户已寄回商品，退款已处理",
                resolution_time=datetime.now() - timedelta(days=1),
                created_at=datetime.now() - timedelta(days=3),
                updated_at=datetime.now() - timedelta(days=1),
                tags=["退货", "颜色问题"],
                assigned_to="客服A"
            )
        ]
        
        for ticket in sample_tickets:
            self.tickets[ticket.ticket_id] = ticket
    
    def get_all_tickets(self,
                       platform: Optional[Platform] = None,
                       status: Optional[TicketStatus] = None,
                       ticket_type: Optional[TicketType] = None,
                       priority: Optional[int] = None) -> List[Ticket]:
        """获取所有工单，支持筛选"""
        tickets = list(self.tickets.values())
        
        if platform:
            tickets = [t for t in tickets if t.platform == platform]
        
        if status:
            tickets = [t for t in tickets if t.status == status]
        
        if ticket_type:
            tickets = [t for t in tickets if t.ticket_type == ticket_type]
        
        if priority:
            tickets = [t for t in tickets if t.priority == priority]
        
        # 按优先级降序，然后按创建时间降序排序
        tickets.sort(key=lambda x: (-x.priority, x.created_at), reverse=True)
        return tickets
    
    def get_ticket_by_id(self, ticket_id: str) -> Optional[Ticket]:
        """根据ID获取工单"""
        return self.tickets.get(ticket_id)
    
    def get_tickets_by_order(self, order_id: str) -> List[Ticket]:
        """获取指定订单的工单"""
        return [t for t in self.tickets.values() if t.order_id == order_id]
    
    def get_tickets_by_platform(self, platform: Platform) -> List[Ticket]:
        """获取指定平台的工单"""
        return [t for t in self.tickets.values() if t.platform == platform]
    
    def get_open_tickets(self) -> List[Ticket]:
        """获取待处理的工单"""
        return [t for t in self.tickets.values() if t.status == TicketStatus.OPEN]
    
    def get_high_priority_tickets(self) -> List[Ticket]:
        """获取高优先级工单（优先级4-5）"""
        return [t for t in self.tickets.values() if t.priority >= 4]
    
    def get_overdue_tickets(self) -> List[Ticket]:
        """获取超时工单"""
        now = datetime.now()
        return [t for t in self.tickets.values() 
                if t.due_date and t.due_date < now and t.status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]]
    
    def create_ticket(self, ticket_data: Dict[str, Any]) -> Ticket:
        """创建新工单"""
        # 生成工单ID
        if "ticket_id" not in ticket_data:
            ticket_data["ticket_id"] = f"TKT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # 设置默认值
        if "created_at" not in ticket_data:
            ticket_data["created_at"] = datetime.now()
        if "updated_at" not in ticket_data:
            ticket_data["updated_at"] = datetime.now()
        
        # 设置默认截止时间（3天后）
        if "due_date" not in ticket_data:
            ticket_data["due_date"] = datetime.now() + timedelta(days=3)
        
        ticket = Ticket(**ticket_data)
        self.tickets[ticket.ticket_id] = ticket
        return ticket
    
    def update_ticket_status(self, ticket_id: str, new_status: TicketStatus) -> Optional[Ticket]:
        """更新工单状态"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        old_status = ticket.status
        ticket.status = new_status
        ticket.updated_at = datetime.now()
        
        # 如果是解决状态，记录解决时间
        if new_status == TicketStatus.RESOLVED:
            ticket.resolution_time = datetime.now()
        
        return ticket
    
    def assign_ticket(self, ticket_id: str, assignee: str) -> Optional[Ticket]:
        """分配工单"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        ticket.assigned_to = assignee
        ticket.updated_at = datetime.now()
        
        # 如果当前是待处理状态，自动改为处理中
        if ticket.status == TicketStatus.OPEN:
            ticket.status = TicketStatus.IN_PROGRESS
        
        return ticket
    
    def resolve_ticket(self, ticket_id: str, resolution: str) -> Optional[Ticket]:
        """解决工单"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        ticket.resolution = resolution
        ticket.resolution_time = datetime.now()
        ticket.status = TicketStatus.RESOLVED
        ticket.updated_at = datetime.now()
        
        return ticket
    
    def close_ticket(self, ticket_id: str) -> Optional[Ticket]:
        """关闭工单"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        ticket.status = TicketStatus.CLOSED
        ticket.updated_at = datetime.now()
        
        return ticket
    
    def update_refund_info(self, ticket_id: str, 
                          refund_amount: Optional[float] = None,
                          refund_reason: Optional[str] = None,
                          refund_status: Optional[str] = None) -> Optional[Ticket]:
        """更新退款信息"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        if refund_amount is not None:
            ticket.refund_amount = refund_amount
        if refund_reason is not None:
            ticket.refund_reason = refund_reason
        if refund_status is not None:
            ticket.refund_status = refund_status
        
        ticket.updated_at = datetime.now()
        return ticket
    
    def add_ticket_tag(self, ticket_id: str, tag: str) -> Optional[Ticket]:
        """添加工单标签"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        if tag not in ticket.tags:
            ticket.tags.append(tag)
            ticket.updated_at = datetime.now()
        
        return ticket
    
    def remove_ticket_tag(self, ticket_id: str, tag: str) -> Optional[Ticket]:
        """移除工单标签"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        if tag in ticket.tags:
            ticket.tags.remove(tag)
            ticket.updated_at = datetime.now()
        
        return ticket
    
    def set_priority(self, ticket_id: str, priority: int) -> Optional[Ticket]:
        """设置工单优先级"""
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None
        
        if 1 <= priority <= 5:
            ticket.priority = priority
            ticket.updated_at = datetime.now()
        
        return ticket
    
    def get_ticket_statistics(self) -> Dict[str, Any]:
        """获取工单统计信息"""
        tickets = list(self.tickets.values())
        total_tickets = len(tickets)
        
        if total_tickets == 0:
            return {
                "total_tickets": 0,
                "status_counts": {},
                "type_counts": {},
                "platform_counts": {},
                "average_resolution_time": 0,
                "overdue_count": 0
            }
        
        # 按状态统计
        status_counts = {}
        for status in TicketStatus:
            count = len([t for t in tickets if t.status == status])
            if count > 0:
                status_counts[status.value] = count
        
        # 按类型统计
        type_counts = {}
        for ticket_type in TicketType:
            count = len([t for t in tickets if t.ticket_type == ticket_type])
            if count > 0:
                type_counts[ticket_type.value] = count
        
        # 按平台统计
        platform_counts = {}
        for platform in Platform:
            count = len([t for t in tickets if t.platform == platform])
            if count > 0:
                platform_counts[platform.value] = count
        
        # 计算平均解决时间
        resolved_tickets = [t for t in tickets if t.resolution_time and t.created_at]
        total_resolution_time = sum((t.resolution_time - t.created_at).total_seconds() 
                                   for t in resolved_tickets)
        average_resolution_time = total_resolution_time / len(resolved_tickets) / 3600 if resolved_tickets else 0  # 转换为小时
        
        # 超时工单数
        overdue_count = len(self.get_overdue_tickets())
        
        return {
            "total_tickets": total_tickets,
            "status_counts": status_counts,
            "type_counts": type_counts,
            "platform_counts": platform_counts,
            "average_resolution_time": round(average_resolution_time, 2),
            "overdue_count": overdue_count
        }
    
    def search_tickets(self, keyword: str) -> List[Ticket]:
        """搜索工单"""
        keyword = keyword.lower()
        results = []
        
        for ticket in self.tickets.values():
            # 搜索工单ID、订单ID、标题、描述、客户投诉
            if (keyword in ticket.ticket_id.lower() or
                keyword in ticket.order_id.lower() or
                keyword in ticket.title.lower() or
                keyword in ticket.description.lower() or
                (ticket.customer_complaint and keyword in ticket.customer_complaint.lower())):
                results.append(ticket)
        
        return results
    
    def get_recent_tickets(self, limit: int = 10) -> List[Ticket]:
        """获取最近工单"""
        tickets = list(self.tickets.values())
        tickets.sort(key=lambda x: x.created_at, reverse=True)
        return tickets[:limit]
    
    def get_tickets_by_assignee(self, assignee: str) -> List[Ticket]:
        """获取指定处理人的工单"""
        return [t for t in self.tickets.values() if t.assigned_to == assignee]
    
    def get_refund_tickets(self) -> List[Ticket]:
        """获取退款工单"""
        return [t for t in self.tickets.values() if t.ticket_type == TicketType.REFUND]
    
    def get_complaint_tickets(self) -> List[Ticket]:
        """获取投诉工单"""
        return [t for t in self.tickets.values() if t.ticket_type == TicketType.COMPLAINT]
