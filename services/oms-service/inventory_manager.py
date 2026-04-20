from datetime import datetime
from typing import List, Optional, Dict, Any
from models import InventoryItem, Platform, RiskLevel


class InventoryManager:
    """库存管理器"""
    
    def __init__(self):
        # 模拟数据存储 - 实际项目中应使用数据库
        self.inventory: Dict[str, InventoryItem] = {}
        self._init_sample_data()
    
    def _init_sample_data(self):
        """初始化示例数据"""
        sample_items = [
            InventoryItem(
                sku_id="SKU-001",
                product_name="夏季新款T恤",
                platform=Platform.DOUYIN,
                total_stock=500,
                available_stock=350,
                locked_stock=50,
                in_transit_stock=100,
                min_stock_alert=50,
                max_stock_alert=1000,
                risk_tags=["热销"],
                risk_level=RiskLevel.LOW,
                category="服装",
                supplier="服装供应商A",
                cost_price=45.0,
                sale_price=99.0
            ),
            InventoryItem(
                sku_id="SKU-002",
                product_name="运动鞋",
                platform=Platform.KUAISHOU,
                total_stock=200,
                available_stock=150,
                locked_stock=30,
                in_transit_stock=20,
                min_stock_alert=30,
                max_stock_alert=500,
                risk_tags=[],
                risk_level=RiskLevel.LOW,
                category="鞋类",
                supplier="鞋类供应商B",
                cost_price=150.0,
                sale_price=299.0
            ),
            InventoryItem(
                sku_id="SKU-003",
                product_name="蓝牙耳机",
                platform=Platform.PINDUODUO,
                total_stock=80,
                available_stock=60,
                locked_stock=15,
                in_transit_stock=5,
                min_stock_alert=20,
                max_stock_alert=300,
                risk_tags=["库存紧张", "质量风险"],
                risk_level=RiskLevel.MEDIUM,
                category="电子产品",
                supplier="电子供应商C",
                cost_price=80.0,
                sale_price=159.0
            ),
            InventoryItem(
                sku_id="SKU-004",
                product_name="二手手机",
                platform=Platform.XIANYU,
                total_stock=15,
                available_stock=8,
                locked_stock=5,
                in_transit_stock=2,
                min_stock_alert=10,
                max_stock_alert=50,
                risk_tags=["二手商品", "高风险"],
                risk_level=RiskLevel.HIGH,
                category="二手数码",
                supplier="个人卖家",
                cost_price=800.0,
                sale_price=1200.0
            ),
            InventoryItem(
                sku_id="SKU-005",
                product_name="护肤套装",
                platform=Platform.DOUYIN,
                total_stock=300,
                available_stock=250,
                locked_stock=30,
                in_transit_stock=20,
                min_stock_alert=50,
                max_stock_alert=500,
                risk_tags=["季节性商品"],
                risk_level=RiskLevel.LOW,
                category="美妆护肤",
                supplier="美妆供应商D",
                cost_price=120.0,
                sale_price=259.0
            )
        ]
        
        for item in sample_items:
            self.inventory[item.sku_id] = item
    
    def get_all_inventory(self,
                         platform: Optional[Platform] = None,
                         risk_level: Optional[RiskLevel] = None,
                         low_stock_only: bool = False) -> List[InventoryItem]:
        """获取所有库存，支持筛选"""
        items = list(self.inventory.values())
        
        if platform:
            items = [i for i in items if i.platform == platform]
        
        if risk_level:
            items = [i for i in items if i.risk_level == risk_level]
        
        if low_stock_only:
            items = [i for i in items if i.available_stock <= i.min_stock_alert]
        
        # 按可用库存升序排序（库存少的排前面）
        items.sort(key=lambda x: x.available_stock)
        return items
    
    def get_inventory_by_sku(self, sku_id: str) -> Optional[InventoryItem]:
        """根据SKU ID获取库存"""
        return self.inventory.get(sku_id)
    
    def get_inventory_by_platform(self, platform: Platform) -> List[InventoryItem]:
        """获取指定平台的库存"""
        return [i for i in self.inventory.values() if i.platform == platform]
    
    def get_low_stock_items(self) -> List[InventoryItem]:
        """获取低库存商品"""
        return [i for i in self.inventory.values() if i.available_stock <= i.min_stock_alert]
    
    def get_high_risk_items(self) -> List[InventoryItem]:
        """获取高风险商品"""
        return [i for i in self.inventory.values() if i.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
    
    def update_stock(self, sku_id: str, 
                    available_stock: Optional[int] = None,
                    locked_stock: Optional[int] = None,
                    in_transit_stock: Optional[int] = None) -> Optional[InventoryItem]:
        """更新库存数量"""
        item = self.inventory.get(sku_id)
        if not item:
            return None
        
        if available_stock is not None:
            item.available_stock = available_stock
        if locked_stock is not None:
            item.locked_stock = locked_stock
        if in_transit_stock is not None:
            item.in_transit_stock = in_transit_stock
        
        # 更新总库存
        item.total_stock = item.available_stock + item.locked_stock + item.in_transit_stock
        item.last_updated = datetime.now()
        
        # 自动更新风险等级
        self._update_risk_level(item)
        
        return item
    
    def _update_risk_level(self, item: InventoryItem):
        """根据库存情况自动更新风险等级"""
        if item.available_stock <= 0:
            item.risk_level = RiskLevel.CRITICAL
            if "缺货" not in item.risk_tags:
                item.risk_tags.append("缺货")
        elif item.available_stock <= item.min_stock_alert * 0.5:
            item.risk_level = RiskLevel.HIGH
            if "库存紧张" not in item.risk_tags:
                item.risk_tags.append("库存紧张")
        elif item.available_stock <= item.min_stock_alert:
            item.risk_level = RiskLevel.MEDIUM
            if "低库存" not in item.risk_tags:
                item.risk_tags.append("低库存")
        else:
            item.risk_level = RiskLevel.LOW
            # 移除相关风险标签
            risk_tags_to_remove = ["缺货", "库存紧张", "低库存"]
            item.risk_tags = [tag for tag in item.risk_tags if tag not in risk_tags_to_remove]
    
    def lock_stock(self, sku_id: str, quantity: int) -> bool:
        """锁定库存（下单时调用）"""
        item = self.inventory.get(sku_id)
        if not item or item.available_stock < quantity:
            return False
        
        item.available_stock -= quantity
        item.locked_stock += quantity
        item.last_updated = datetime.now()
        self._update_risk_level(item)
        return True
    
    def unlock_stock(self, sku_id: str, quantity: int) -> bool:
        """解锁库存（取消订单时调用）"""
        item = self.inventory.get(sku_id)
        if not item or item.locked_stock < quantity:
            return False
        
        item.locked_stock -= quantity
        item.available_stock += quantity
        item.last_updated = datetime.now()
        self._update_risk_level(item)
        return True
    
    def ship_stock(self, sku_id: str, quantity: int) -> bool:
        """发货时扣减锁定库存"""
        item = self.inventory.get(sku_id)
        if not item or item.locked_stock < quantity:
            return False
        
        item.locked_stock -= quantity
        item.total_stock -= quantity
        item.last_updated = datetime.now()
        self._update_risk_level(item)
        return True
    
    def receive_stock(self, sku_id: str, quantity: int) -> bool:
        """到货时增加库存"""
        item = self.inventory.get(sku_id)
        if not item:
            return False
        
        # 从在途库存转为可用库存
        if item.in_transit_stock >= quantity:
            item.in_transit_stock -= quantity
            item.available_stock += quantity
        else:
            # 直接增加可用库存
            item.available_stock += quantity
        
        item.total_stock = item.available_stock + item.locked_stock + item.in_transit_stock
        item.last_updated = datetime.now()
        self._update_risk_level(item)
        return True
    
    def add_risk_tag(self, sku_id: str, tag: str) -> Optional[InventoryItem]:
        """添加风险标签"""
        item = self.inventory.get(sku_id)
        if not item:
            return None
        
        if tag not in item.risk_tags:
            item.risk_tags.append(tag)
            item.last_updated = datetime.now()
        
        return item
    
    def remove_risk_tag(self, sku_id: str, tag: str) -> Optional[InventoryItem]:
        """移除风险标签"""
        item = self.inventory.get(sku_id)
        if not item:
            return None
        
        if tag in item.risk_tags:
            item.risk_tags.remove(tag)
            item.last_updated = datetime.now()
        
        return item
    
    def set_risk_level(self, sku_id: str, risk_level: RiskLevel) -> Optional[InventoryItem]:
        """手动设置风险等级"""
        item = self.inventory.get(sku_id)
        if not item:
            return None
        
        item.risk_level = risk_level
        item.last_updated = datetime.now()
        return item
    
    def get_inventory_statistics(self) -> Dict[str, Any]:
        """获取库存统计信息"""
        items = list(self.inventory.values())
        total_items = len(items)
        
        if total_items == 0:
            return {
                "total_items": 0,
                "total_stock": 0,
                "available_stock": 0,
                "locked_stock": 0,
                "in_transit_stock": 0,
                "low_stock_count": 0,
                "high_risk_count": 0,
                "platform_stats": {},
                "category_stats": {}
            }
        
        total_stock = sum(i.total_stock for i in items)
        available_stock = sum(i.available_stock for i in items)
        locked_stock = sum(i.locked_stock for i in items)
        in_transit_stock = sum(i.in_transit_stock for i in items)
        
        low_stock_count = len([i for i in items if i.available_stock <= i.min_stock_alert])
        high_risk_count = len([i for i in items if i.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]])
        
        # 按平台统计
        platform_stats = {}
        for platform in Platform:
            platform_items = [i for i in items if i.platform == platform]
            if platform_items:
                platform_stats[platform.value] = {
                    "item_count": len(platform_items),
                    "total_stock": sum(i.total_stock for i in platform_items),
                    "available_stock": sum(i.available_stock for i in platform_items)
                }
        
        # 按分类统计
        category_stats = {}
        categories = set(i.category for i in items if i.category)
        for category in categories:
            category_items = [i for i in items if i.category == category]
            category_stats[category] = {
                "item_count": len(category_items),
                "total_stock": sum(i.total_stock for i in category_items)
            }
        
        return {
            "total_items": total_items,
            "total_stock": total_stock,
            "available_stock": available_stock,
            "locked_stock": locked_stock,
            "in_transit_stock": in_transit_stock,
            "low_stock_count": low_stock_count,
            "high_risk_count": high_risk_count,
            "platform_stats": platform_stats,
            "category_stats": category_stats
        }
    
    def search_inventory(self, keyword: str) -> List[InventoryItem]:
        """搜索库存"""
        keyword = keyword.lower()
        results = []
        
        for item in self.inventory.values():
            # 搜索SKU ID、商品名称、分类、供应商
            if (keyword in item.sku_id.lower() or
                keyword in item.product_name.lower() or
                (item.category and keyword in item.category.lower()) or
                (item.supplier and keyword in item.supplier.lower())):
                results.append(item)
        
        return results
    
    def create_inventory_item(self, item_data: Dict[str, Any]) -> InventoryItem:
        """创建新库存项目"""
        # 设置默认值
        if "last_updated" not in item_data:
            item_data["last_updated"] = datetime.now()
        if "created_at" not in item_data:
            item_data["created_at"] = datetime.now()
        
        item = InventoryItem(**item_data)
        self.inventory[item.sku_id] = item
        
        # 初始风险评估
        self._update_risk_level(item)
        
        return item
    
    def delete_inventory_item(self, sku_id: str) -> bool:
        """删除库存项目"""
        if sku_id in self.inventory:
            del self.inventory[sku_id]
            return True
        return False
