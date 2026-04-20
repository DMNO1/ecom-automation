"""
商品管理 - 处理闲鱼商品的上架、下架、编辑等操作
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass

try:
    from .xianyu_client import XianyuClient, XianyuProduct
    from .config import settings
except ImportError:
    from xianyu_client import XianyuClient, XianyuProduct
    from config import settings

logger = logging.getLogger(__name__)


@dataclass
class ProductTemplate:
    """商品模板"""
    id: str
    name: str
    title_template: str
    description_template: str
    price_range: Dict[str, float]  # min, max
    category: str
    images: List[str]
    auto_repost: bool = False
    tags: List[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []


class ProductManager:
    """商品管理器"""
    
    def __init__(self, client: XianyuClient):
        self.client = client
        self.templates: Dict[str, ProductTemplate] = {}
        self.products_cache: Dict[str, XianyuProduct] = {}
        self.last_sync_time: Optional[datetime] = None
    
    async def sync_products(self) -> List[XianyuProduct]:
        """同步商品列表"""
        try:
            products = await self.client.get_products()
            
            # 更新缓存
            self.products_cache = {p.product_id: p for p in products}
            self.last_sync_time = datetime.now()
            
            logger.info(f"同步了 {len(products)} 个商品")
            return products
            
        except Exception as e:
            logger.error(f"同步商品失败: {e}")
            return []
    
    async def get_products(self, force_refresh: bool = False) -> List[XianyuProduct]:
        """获取商品列表"""
        try:
            # 检查是否需要刷新
            if force_refresh or not self.products_cache:
                await self.sync_products()
            
            return list(self.products_cache.values())
            
        except Exception as e:
            logger.error(f"获取商品失败: {e}")
            return []
    
    async def get_product(self, product_id: str) -> Optional[XianyuProduct]:
        """获取单个商品"""
        try:
            # 先从缓存查找
            if product_id in self.products_cache:
                return self.products_cache[product_id]
            
            # 缓存中没有，刷新后查找
            await self.sync_products()
            return self.products_cache.get(product_id)
            
        except Exception as e:
            logger.error(f"获取商品失败: {e}")
            return None
    
    async def create_product(self, product_data: Dict[str, Any]) -> Optional[str]:
        """创建商品"""
        try:
            if not self.client.is_logged_in:
                raise Exception("未登录")
            
            # 这里需要实现具体的创建商品逻辑
            # 包括上传图片、填写表单等
            
            logger.info(f"创建商品: {product_data.get('title', 'Unknown')}")
            
            # 模拟创建成功
            product_id = f"product_{datetime.now().timestamp()}"
            
            # 更新缓存
            new_product = XianyuProduct(
                product_id=product_id,
                title=product_data.get("title", ""),
                price=float(product_data.get("price", 0)),
                description=product_data.get("description", ""),
                images=product_data.get("images", []),
                status="on_sale",
                category=product_data.get("category"),
                created_at=datetime.now(),
            )
            self.products_cache[product_id] = new_product
            
            return product_id
            
        except Exception as e:
            logger.error(f"创建商品失败: {e}")
            return None
    
    async def update_product(self, product_id: str, updates: Dict[str, Any]) -> bool:
        """更新商品"""
        try:
            if not self.client.is_logged_in:
                raise Exception("未登录")
            
            # 这里需要实现具体的更新商品逻辑
            
            logger.info(f"更新商品 {product_id}: {updates}")
            
            # 更新缓存
            if product_id in self.products_cache:
                product = self.products_cache[product_id]
                for key, value in updates.items():
                    if hasattr(product, key):
                        setattr(product, key, value)
            
            return True
            
        except Exception as e:
            logger.error(f"更新商品失败: {e}")
            return False
    
    async def delete_product(self, product_id: str) -> bool:
        """删除商品（下架）"""
        try:
            if not self.client.is_logged_in:
                raise Exception("未登录")
            
            # 这里需要实现具体的删除逻辑
            
            logger.info(f"删除商品: {product_id}")
            
            # 更新缓存状态
            if product_id in self.products_cache:
                self.products_cache[product_id].status = "deleted"
            
            return True
            
        except Exception as e:
            logger.error(f"删除商品失败: {e}")
            return False
    
    async def repost_product(self, product_id: str) -> bool:
        """重新上架商品"""
        try:
            if not self.client.is_logged_in:
                raise Exception("未登录")

            
            # 这里需要实现具体的重新上架逻辑
            
            logger.info(f"重新上架商品: {product_id}")
            
            # 更新缓存状态
            if product_id in self.products_cache:
                self.products_cache[product_id].status = "on_sale"
            
            return True
            
        except Exception as e:
            logger.error(f"重新上架商品失败: {e}")
            return False
    
    async def batch_update_prices(self, updates: Dict[str, float]) -> Dict[str, bool]:
        """批量更新价格"""
        results = {}
        
        for product_id, new_price in updates.items():
            success = await self.update_product(product_id, {"price": new_price})
            results[product_id] = success
            
            # 避免请求过快
            await asyncio.sleep(0.5)
        
        return results
    
    async def get_product_statistics(self) -> Dict[str, Any]:
        """获取商品统计信息"""
        try:
            products = await self.get_products()
            
            stats = {
                "total": len(products),
                "on_sale": 0,
                "sold_out": 0,
                "deleted": 0,
                "total_value": 0.0,
                "average_price": 0.0,
            }
            
            for product in products:
                if product.status == "on_sale":
                    stats["on_sale"] += 1
                elif product.status == "sold_out":
                    stats["sold_out"] += 1
                elif product.status == "deleted":
                    stats["deleted"] += 1
                
                stats["total_value"] += product.price
            
            if stats["total"] > 0:
                stats["average_price"] = stats["total_value"] / stats["total"]
            
            return stats
            
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}
    
    async def create_from_template(self, template_id: str, variables: Dict[str, Any]) -> Optional[str]:
        """从模板创建商品"""
        try:
            if template_id not in self.templates:
                logger.error(f"模板不存在: {template_id}")
                return None
            
            template = self.templates[template_id]
            
            # 替换模板变量
            title = self._replace_variables(template.title_template, variables)
            description = self._replace_variables(template.description_template, variables)
            
            # 构建商品数据
            product_data = {
                "title": title,
                "description": description,
                "price": variables.get("price", template.price_range.get("min", 0)),
                "category": template.category,
                "images": template.images,
                "tags": template.tags,
            }
            
            return await self.create_product(product_data)
            
        except Exception as e:
            logger.error(f"从模板创建商品失败: {e}")
            return None
    
    def _replace_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """替换模板变量"""
        result = template
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            result = result.replace(placeholder, str(value))
        return result
    
    async def add_template(self, template: ProductTemplate) -> bool:
        """添加商品模板"""
        try:
            if template.id in self.templates:
                logger.error(f"模板ID已存在: {template.id}")
                return False
            
            self.templates[template.id] = template
            logger.info(f"添加模板成功: {template.name}")
            return True
            
        except Exception as e:
            logger.error(f"添加模板失败: {e}")
            return False
    
    async def remove_template(self, template_id: str) -> bool:
        """删除商品模板"""
        try:
            if template_id not in self.templates:
                logger.error(f"模板不存在: {template_id}")
                return False
            
            del self.templates[template_id]
            logger.info(f"删除模板成功: {template_id}")
            return True
            
        except Exception as e:
            logger.error(f"删除模板失败: {e}")
            return False
    
    async def get_templates(self) -> List[ProductTemplate]:
        """获取所有模板"""
        return list(self.templates.values())


# 商品管理器管理器
class ProductManagerRegistry:
    """商品管理器注册表"""
    
    def __init__(self):
        self.managers: Dict[str, ProductManager] = {}
    
    async def get_manager(self, account_id: str, client: XianyuClient) -> ProductManager:
        """获取或创建商品管理器"""
        if account_id not in self.managers:
            manager = ProductManager(client)
            self.managers[account_id] = manager
        
        return self.managers[account_id]


# 全局注册表
product_manager_registry = ProductManagerRegistry()