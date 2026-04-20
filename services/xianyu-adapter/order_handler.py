"""
订单处理 - 处理闲鱼订单的自动发货、确认发货等操作
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass

try:
    from .xianyu_client import XianyuClient, XianyuOrder
    from .config import settings
except ImportError:
    from xianyu_client import XianyuClient, XianyuOrder
    from config import settings

logger = logging.getLogger(__name__)


@dataclass
class ShippingInfo:
    """发货信息"""
    order_id: str
    tracking_number: str
    carrier: str  # 快递公司
    shipping_method: str = "标准快递"
    notes: Optional[str] = None


@dataclass
class AutoShipRule:
    """自动发货规则"""
    id: str
    name: str
    product_id: Optional[str] = None  # 特定商品，None表示所有商品
    condition: str = "paid"  # paid, all
    action: str = "virtual_ship"  # virtual_ship, manual_review
    delay_minutes: int = 0  # 延迟分钟数
    is_active: bool = True


class OrderHandler:
    """订单处理器"""
    
    def __init__(self, client: XianyuClient):
        self.client = client
        self.auto_ship_rules: List[AutoShipRule] = []
        self.orders_cache: Dict[str, XianyuOrder] = {}
        self.last_sync_time: Optional[datetime] = None
        self.monitor_task: Optional[asyncio.Task] = None
        self.is_monitoring = False
        
        # 加载默认规则
        self._load_default_rules()
    
    def _load_default_rules(self):
        """加载默认自动发货规则"""
        default_rules = [
            AutoShipRule(
                id="auto_ship_virtual",
                name="虚拟商品自动发货",
                condition="paid",
                action="virtual_ship",
                delay_minutes=1,
            ),
            AutoShipRule(
                id="manual_review",
                name="实物商品人工审核",
                condition="paid",
                action="manual_review",
                delay_minutes=0,
            ),
        ]
        
        self.auto_ship_rules.extend(default_rules)
        logger.info(f"加载了 {len(default_rules)} 条默认发货规则")
    
    async def sync_orders(self, status: Optional[str] = None) -> List[XianyuOrder]:
        """同步订单列表"""
        try:
            orders = await self.client.get_orders(status=status)
            
            # 更新缓存
            for order in orders:
                self.orders_cache[order.order_id] = order
            
            self.last_sync_time = datetime.now()
            logger.info(f"同步了 {len(orders)} 个订单")
            return orders
            
        except Exception as e:
            logger.error(f"同步订单失败: {e}")
            return []
    
    async def get_orders(self, status: Optional[str] = None, force_refresh: bool = False) -> List[XianyuOrder]:
        """获取订单列表"""
        try:
            if force_refresh or not self.orders_cache:
                await self.sync_orders(status=status)
            
            orders = list(self.orders_cache.values())
            
            # 按状态过滤
            if status:
                orders = [o for o in orders if o.status == status]
            
            return orders
            
        except Exception as e:
            logger.error(f"获取订单失败: {e}")
            return []
    
    async def get_order(self, order_id: str) -> Optional[XianyuOrder]:
        """获取单个订单"""
        try:
            # 先从缓存查找
            if order_id in self.orders_cache:
                return self.orders_cache[order_id]
            
            # 缓存中没有，刷新后查找
            await self.sync_orders()
            return self.orders_cache.get(order_id)
            
        except Exception as e:
            logger.error(f"获取订单失败: {e}")
            return None
    
    async def ship_order(self, shipping_info: ShippingInfo) -> bool:
        """发货订单"""
        try:
            if not self.client.is_logged_in:
                raise Exception("未登录")
            
            # 调用客户端发货
            success = await self.client.ship_order(
                order_id=shipping_info.order_id,
                tracking_number=shipping_info.tracking_number,
            )
            
            if success:
                # 更新缓存状态
                if shipping_info.order_id in self.orders_cache:
                    self.orders_cache[shipping_info.order_id].status = "shipped"
                    self.orders_cache[shipping_info.order_id].tracking_number = shipping_info.tracking_number
                    self.orders_cache[shipping_info.order_id].updated_at = datetime.now()
                
                logger.info(f"发货成功: {shipping_info.order_id}")
                return True
            else:
                logger.error(f"发货失败: {shipping_info.order_id}")
                return False
                
        except Exception as e:
            logger.error(f"发货异常: {e}")
            return False
    
    async def auto_ship_orders(self) -> Dict[str, bool]:
        """自动发货处理"""
        results = {}
        
        try:
            # 获取待发货订单
            pending_orders = await self.get_orders(status="paid")
            
            for order in pending_orders:
                try:
                    # 查找匹配的规则
                    rule = self._find_matching_rule(order)
                    
                    if not rule:
                        continue
                    
                    if rule.action == "virtual_ship":
                        # 虚拟商品自动发货
                        tracking_number = f"VIRTUAL_{order.order_id[:8]}"
                        shipping_info = ShippingInfo(
                            order_id=order.order_id,
                            tracking_number=tracking_number,
                            carrier="虚拟发货",
                            notes="系统自动发货",
                        )
                        
                        # 延迟处理
                        if rule.delay_minutes > 0:
                            await asyncio.sleep(rule.delay_minutes * 60)
                        
                        success = await self.ship_order(shipping_info)
                        results[order.order_id] = success
                        
                    elif rule.action == "manual_review":
                        # 需要人工审核
                        logger.info(f"订单需要人工审核: {order.order_id}")
                        results[order.order_id] = False
                    
                    # 避免请求过快
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"处理订单异常 {order.order_id}: {e}")
                    results[order.order_id] = False
            
            return results
            
        except Exception as e:
            logger.error(f"自动发货处理失败: {e}")
            return {}
    
    def _find_matching_rule(self, order: XianyuOrder) -> Optional[AutoShipRule]:
        """查找匹配的发货规则"""
        for rule in self.auto_ship_rules:
            if not rule.is_active:
                continue
            
            # 检查商品匹配
            if rule.product_id and rule.product_id != order.product_id:
                continue
            
            # 检查条件匹配
            if rule.condition == "paid" and order.status == "paid":
                return rule
            elif rule.condition == "all":
                return rule
        
        return None
    
    async def start_monitoring(self, interval: int = 60):
        """开始订单监控"""
        if self.is_monitoring:
            logger.warning("订单监控已在运行")
            return
        
        self.is_monitoring = True
        self.monitor_task = asyncio.create_task(
            self._monitor_orders(interval)
        )
        logger.info(f"开始订单监控，间隔: {interval}秒")
    
    async def stop_monitoring(self):
        """停止订单监控"""
        self.is_monitoring = False
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("订单监控已停止")
    
    async def _monitor_orders(self, interval: int):
        """订单监控循环"""
        while self.is_monitoring:
            try:
                # 同步订单
                await self.sync_orders()
                
                # 自动发货处理
                await self.auto_ship_orders()
                
                # 等待下次检查
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"订单监控异常: {e}")
                await asyncio.sleep(interval)
    
    async def add_auto_ship_rule(self, rule: AutoShipRule) -> bool:
        """添加自动发货规则"""
        try:
            # 检查规则ID是否重复
            if any(r.id == rule.id for r in self.auto_ship_rules):
                logger.error(f"规则ID已存在: {rule.id}")
                return False
            
            self.auto_ship_rules.append(rule)
            logger.info(f"添加发货规则成功: {rule.name}")
            return True
            
        except Exception as e:
            logger.error(f"添加发货规则失败: {e}")
            return False
    
    async def remove_auto_ship_rule(self, rule_id: str) -> bool:
        """删除自动发货规则"""
        try:
            original_count = len(self.auto_ship_rules)
            self.auto_ship_rules = [r for r in self.auto_ship_rules if r.id != rule_id]
            
            if len(self.auto_ship_rules) < original_count:
                logger.info(f"删除发货规则成功: {rule_id}")
                return True
            else:
                logger.error(f"发货规则不存在: {rule_id}")
                return False
                
        except Exception as e:
            logger.error(f"删除发货规则失败: {e}")
            return False
    
    async def get_auto_ship_rules(self) -> List[AutoShipRule]:
        """获取所有自动发货规则"""
        return self.auto_ship_rules
    
    async def get_order_statistics(self) -> Dict[str, Any]:
        """获取订单统计信息"""
        try:
            orders = await self.get_orders()
            
            stats = {
                "total": len(orders),
                "pending_payment": 0,
                "paid": 0,
                "shipped": 0,
                "completed": 0,
                "cancelled": 0,
                "total_amount": 0.0,
                "today_orders": 0,
                "today_amount": 0.0,
            }
            
            today = datetime.now().date()
            
            for order in orders:
                # 按状态统计
                if order.status == "pending_payment":
                    stats["pending_payment"] += 1
                elif order.status == "paid":
                    stats["paid"] += 1
                elif order.status == "shipped":
                    stats["shipped"] += 1
                elif order.status == "completed":
                    stats["completed"] += 1
                elif order.status == "cancelled":
                    stats["cancelled"] += 1
                
                # 金额统计
                if order.status not in ["cancelled"]:
                    stats["total_amount"] += order.amount
                
                # 今日统计
                if order.created_at.date() == today:
                    stats["today_orders"] += 1
                    if order.status not in ["cancelled"]:
                        stats["today_amount"] += order.amount
            
            return stats
            
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}


# 订单处理器管理器
class OrderHandlerRegistry:
    """订单处理器注册表"""
    
    def __init__(self):
        self.handlers: Dict[str, OrderHandler] = {}
    
    async def get_handler(self, account_id: str, client: XianyuClient) -> OrderHandler:
        """获取或创建订单处理器"""
        if account_id not in self.handlers:
            handler = OrderHandler(client)
            self.handlers[account_id] = handler
        
        return self.handlers[account_id]


# 全局注册表
order_handler_registry = OrderHandlerRegistry()