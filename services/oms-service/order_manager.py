from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid
from models import Order, OrderStatus, Platform, PaymentStatus, RiskLevel


class OrderManager:
    """订单管理器"""
    
    def __init__(self):
        # 模拟数据存储 - 实际项目中应使用数据库
        self.orders: Dict[str, Order] = {}
        self._init_sample_data()
    

    def _create_sample_order_1(self) -> Order:
        return Order(
                order_id="ORD-2024-001",
                platform=Platform.DOUYIN,
                platform_order_id="DY123456789",
                status=OrderStatus.PROCESSING,
                payment_status=PaymentStatus.PAID,
                items=[
                    {
                        "sku_id": "SKU-001",
                        "product_name": "夏季新款T恤",
                        "quantity": 2,
                        "unit_price": 99.0,
                        "total_price": 198.0,
                        "specifications": {"颜色": "白色", "尺码": "L"}
                    }
                ],
                total_amount=198.0,
                discount_amount=20.0,
                actual_amount=178.0,
                customer={
                    "customer_id": "CUST-001",
                    "name": "张三",
                    "phone": "13800138001",
                    "address": "北京市朝阳区xxx街道",
                    "platform_uid": "DY-USER-001"
                },
                shipping={
                    "carrier": "顺丰速运",
                    "tracking_number": "SF1234567890",
                    "shipping_method": "快递",
                    "estimated_delivery": datetime.now() + timedelta(days=3)
                },
                payment={
                    "payment_method": "支付宝",
                    "transaction_id": "ALI20240001",
                    "payment_time": datetime.now() - timedelta(hours=2),
                    "amount": 178.0
                },
                created_at=datetime.now() - timedelta(hours=3),
                updated_at=datetime.now(),
                paid_at=datetime.now() - timedelta(hours=2),
                tags=["VIP客户", "加急"],
                risk_level=RiskLevel.LOW
            )

    def _create_sample_order_2(self) -> Order:
        return Order(
                order_id="ORD-2024-002",
                platform=Platform.KUAISHOU,
                platform_order_id="KS987654321",
                status=OrderStatus.PENDING,
                payment_status=PaymentStatus.PAID,
                items=[
                    {
                        "sku_id": "SKU-002",
                        "product_name": "运动鞋",
                        "quantity": 1,
                        "unit_price": 299.0,
                        "total_price": 299.0,
                        "specifications": {"颜色": "黑色", "尺码": "42"}
                    }
                ],
                total_amount=299.0,
                discount_amount=0,
                actual_amount=299.0,
                customer={
                    "customer_id": "CUST-002",
                    "name": "李四",
                    "phone": "13900139002",
                    "address": "上海市浦东新区xxx路",
                    "platform_uid": "KS-USER-002"
                },
                created_at=datetime.now() - timedelta(hours=1),
                updated_at=datetime.now(),
                paid_at=datetime.now() - timedelta(minutes=30),
                tags=["新客户"],
                risk_level=RiskLevel.LOW
            )

    def _create_sample_order_3(self) -> Order:
        return Order(
                order_id="ORD-2024-003",
                platform=Platform.PINDUODUO,
                platform_order_id="PDD111222333",
                status=OrderStatus.REFUNDING,
                payment_status=PaymentStatus.PAID,
                items=[
                    {
                        "sku_id": "SKU-003",
                        "product_name": "蓝牙耳机",
                        "quantity": 1,
                        "unit_price": 159.0,
                        "total_price": 159.0,
                        "specifications": {"颜色": "白色"}
                    }
                ],
                total_amount=159.0,
                discount_amount=10.0,
                actual_amount=149.0,
                customer={
                    "customer_id": "CUST-003",
                    "name": "王五",
                    "phone": "13700137003",
                    "address": "广州市天河区xxx号",
                    "platform_uid": "PDD-USER-003"
                },
                created_at=datetime.now() - timedelta(days=1),
                updated_at=datetime.now(),
                paid_at=datetime.now() - timedelta(days=1),
                tags=["退款中", "质量投诉"],
                risk_level=RiskLevel.MEDIUM,
                remarks="客户反映耳机有杂音"
            )

    def _init_sample_data(self):
        """初始化示例数据"""
        sample_orders = [
            self._create_sample_order_1(),
            self._create_sample_order_2(),
            self._create_sample_order_3()
        ]
        
        for order in sample_orders:
            self.orders[order.order_id] = order
    
    def get_all_orders(self, 
                      platform: Optional[Platform] = None,
                      status: Optional[OrderStatus] = None,
                      start_date: Optional[datetime] = None,
                      end_date: Optional[datetime] = None) -> List[Order]:
        """获取所有订单，支持筛选"""
        orders = list(self.orders.values())
        
        if platform:
            orders = [o for o in orders if o.platform == platform]
        
        if status:
            orders = [o for o in orders if o.status == status]
        
        if start_date:
            orders = [o for o in orders if o.created_at >= start_date]
        
        if end_date:
            orders = [o for o in orders if o.created_at <= end_date]
        
        # 按创建时间降序排序
        orders.sort(key=lambda x: x.created_at, reverse=True)
        return orders
    
    def get_order_by_id(self, order_id: str) -> Optional[Order]:
        """根据ID获取订单"""
        return self.orders.get(order_id)
    
    def get_orders_by_platform(self, platform: Platform) -> List[Order]:
        """获取指定平台的订单"""
        return [o for o in self.orders.values() if o.platform == platform]
    
    def get_orders_by_status(self, status: OrderStatus) -> List[Order]:
        """获取指定状态的订单"""
        return [o for o in self.orders.values() if o.status == status]
    
    def create_order(self, order_data: Dict[str, Any]) -> Order:
        """创建新订单"""
        # 生成订单ID
        if "order_id" not in order_data:
            order_data["order_id"] = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # 设置默认值
        if "created_at" not in order_data:
            order_data["created_at"] = datetime.now()
        if "updated_at" not in order_data:
            order_data["updated_at"] = datetime.now()
        
        order = Order(**order_data)
        self.orders[order.order_id] = order
        return order
    
    def update_order_status(self, order_id: str, new_status: OrderStatus) -> Optional[Order]:
        """更新订单状态"""
        order = self.orders.get(order_id)
        if not order:
            return None
        
        old_status = order.status
        order.status = new_status
        order.updated_at = datetime.now()
        
        # 更新相关时间字段
        if new_status == OrderStatus.SHIPPED:
            order.shipped_at = datetime.now()
        elif new_status == OrderStatus.COMPLETED:
            order.completed_at = datetime.now()
        
        return order
    
    def update_payment_status(self, order_id: str, payment_status: PaymentStatus) -> Optional[Order]:
        """更新支付状态"""
        order = self.orders.get(order_id)
        if not order:
            return None
        
        order.payment_status = payment_status
        order.updated_at = datetime.now()
        
        if payment_status == PaymentStatus.PAID:
            order.paid_at = datetime.now()
        
        return order
    
    def add_order_tag(self, order_id: str, tag: str) -> Optional[Order]:
        """添加订单标签"""
        order = self.orders.get(order_id)
        if not order:
            return None
        
        if tag not in order.tags:
            order.tags.append(tag)
            order.updated_at = datetime.now()
        
        return order
    
    def remove_order_tag(self, order_id: str, tag: str) -> Optional[Order]:
        """移除订单标签"""
        order = self.orders.get(order_id)
        if not order:
            return None
        
        if tag in order.tags:
            order.tags.remove(tag)
            order.updated_at = datetime.now()
        
        return order
    
    def set_order_risk_level(self, order_id: str, risk_level: RiskLevel) -> Optional[Order]:
        """设置订单风险等级"""
        order = self.orders.get(order_id)
        if not order:
            return None
        
        order.risk_level = risk_level
        order.updated_at = datetime.now()
        return order
    
    def get_order_statistics(self) -> Dict[str, Any]:
        """获取订单统计信息"""
        orders = list(self.orders.values())
        total_orders = len(orders)
        
        if total_orders == 0:
            return {
                "total_orders": 0,
                "status_counts": {},
                "platform_counts": {},
                "total_revenue": 0,
                "average_order_value": 0
            }
        
        # 按状态统计
        status_counts = {}
        for status in OrderStatus:
            count = len([o for o in orders if o.status == status])
            if count > 0:
                status_counts[status.value] = count
        
        # 按平台统计
        platform_counts = {}
        for platform in Platform:
            count = len([o for o in orders if o.platform == platform])
            if count > 0:
                platform_counts[platform.value] = count
        
        # 收入统计
        total_revenue = sum(o.actual_amount for o in orders if o.payment_status == PaymentStatus.PAID)
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        return {
            "total_orders": total_orders,
            "status_counts": status_counts,
            "platform_counts": platform_counts,
            "total_revenue": total_revenue,
            "average_order_value": average_order_value
        }
    
    def search_orders(self, keyword: str) -> List[Order]:
        """搜索订单"""
        keyword = keyword.lower()
        results = []
        
        for order in self.orders.values():
            # 搜索订单ID、平台订单ID、客户姓名、商品名称
            if (keyword in order.order_id.lower() or
                keyword in order.platform_order_id.lower() or
                keyword in order.customer.name.lower() or
                any(keyword in item["product_name"].lower() for item in order.items)):
                results.append(order)
        
        return results
    
    def get_recent_orders(self, limit: int = 10) -> List[Order]:
        """获取最近订单"""
        orders = list(self.orders.values())
        orders.sort(key=lambda x: x.created_at, reverse=True)
        return orders[:limit]
    
    def get_high_risk_orders(self) -> List[Order]:
        """获取高风险订单"""
        return [o for o in self.orders.values() if o.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
    
    def get_refunding_orders(self) -> List[Order]:
        """获取退款中的订单"""
        return [o for o in self.orders.values() if o.status == OrderStatus.REFUNDING]
