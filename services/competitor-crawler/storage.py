"""
数据存储模块
支持MongoDB和文件系统存储
"""
import json
import hashlib
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

import aiofiles
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger
from pydantic import BaseModel, Field


class Platform(str, Enum):
    DOUYIN = "douyin"
    KUAISHOU = "kuaishou"
    PDD = "pdd"
    XIANYU = "xianyu"


class ProductSnapshot(BaseModel):
    """商品快照数据模型"""
    platform: Platform
    product_id: str
    url: str
    title: str
    price: float
    original_price: Optional[float] = None
    main_image_hash: str
    promotion_tags: List[str] = Field(default_factory=list)
    comment_keywords: List[str] = Field(default_factory=list)
    sales_count: Optional[int] = None
    shop_name: Optional[str] = None
    crawl_time: datetime = Field(default_factory=datetime.now)
    raw_data: Dict[str, Any] = Field(default_factory=dict)


class Storage:
    """存储管理器"""
    
    def __init__(self, mongodb_url: str = "mongodb://localhost:27017", 
                 db_name: str = "competitor_crawler",
                 data_dir: str = "./data"):
        self.mongodb_url = mongodb_url
        self.db_name = db_name
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # MongoDB连接
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        
    async def connect(self):
        """连接数据库"""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_url)
            self.db = self.client[self.db_name]
            
            # 创建索引
            await self.db.snapshots.create_index([
                ("platform", 1),
                ("product_id", 1),
                ("crawl_time", -1)
            ])
            await self.db.snapshots.create_index([("crawl_time", -1)])
            
            logger.info(f"Connected to MongoDB: {self.db_name}")
        except Exception as e:
            logger.error(f"Failed to connect MongoDB: {e}")
            raise
    
    async def close(self):
        """关闭数据库连接"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    async def save_snapshot(self, snapshot: ProductSnapshot) -> str:
        """保存商品快照"""
        try:
            # 保存到MongoDB
            result = await self.db.snapshots.insert_one(snapshot.dict())
            
            # 同时保存原始数据到文件系统
            file_path = self.data_dir / snapshot.platform.value / snapshot.product_id
            file_path.mkdir(parents=True, exist_ok=True)
            
            filename = f"{snapshot.crawl_time.strftime('%Y%m%d_%H%M%S')}.json"
            async with aiofiles.open(file_path / filename, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(snapshot.dict(), default=str, ensure_ascii=False, indent=2))
            
            logger.info(f"Saved snapshot: {snapshot.platform.value}/{snapshot.product_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to save snapshot: {e}")
            raise
    
    async def get_latest_snapshot(self, platform: Platform, product_id: str) -> Optional[ProductSnapshot]:
        """获取最新快照"""
        try:
            doc = await self.db.snapshots.find_one(
                {"platform": platform.value, "product_id": product_id},
                sort=[("crawl_time", -1)]
            )
            if doc:
                doc.pop('_id', None)
                return ProductSnapshot(**doc)
            return None
        except Exception as e:
            logger.error(f"Failed to get latest snapshot: {e}")
            return None

    async def get_latest_snapshots(self, platforms: List[Platform], product_id: str) -> Dict[Platform, ProductSnapshot]:
        """批量获取多个平台的最新快照"""
        try:
            platform_values = [p.value for p in platforms]
            pipeline = [
                {"$match": {"platform": {"$in": platform_values}, "product_id": product_id}},
                {"$sort": {"crawl_time": -1}},
                {"$group": {
                    "_id": "$platform",
                    "doc": {"$first": "$$ROOT"}
                }}
            ]

            cursor = self.db.snapshots.aggregate(pipeline)
            results = await cursor.to_list(length=None)

            snapshots = {}
            for result in results:
                doc = result["doc"]
                doc.pop('_id', None)
                platform_enum = Platform(doc["platform"])
                snapshots[platform_enum] = ProductSnapshot(**doc)

            return snapshots
        except Exception as e:
            logger.error(f"Failed to get latest snapshots for multiple platforms: {e}")
            return {}
    
    async def get_price_history(self, platform: Platform, product_id: str, 
                               days: int = 30) -> List[Dict]:
        """获取价格历史"""
        try:
            from datetime import timedelta
            start_date = datetime.now() - timedelta(days=days)
            
            cursor = self.db.snapshots.find(
                {
                    "platform": platform.value,
                    "product_id": product_id,
                    "crawl_time": {"$gte": start_date}
                },
                {"crawl_time": 1, "price": 1, "original_price": 1}
            ).sort("crawl_time", 1)
            
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Failed to get price history: {e}")
            return []
    
    async def get_all_products(self, platform: Optional[Platform] = None) -> List[Dict]:
        """获取所有监控商品"""
        try:
            query = {}
            if platform:
                query["platform"] = platform.value
            
            pipeline = [
                {"$match": query},
                {"$sort": {"crawl_time": -1}},
                {"$group": {
                    "_id": {"platform": "$platform", "product_id": "$product_id"},
                    "latest_title": {"$first": "$title"},
                    "latest_price": {"$first": "$price"},
                    "last_crawl": {"$first": "$crawl_time"}
                }},
                {"$project": {
                    "platform": "$_id.platform",
                    "product_id": "$_id.product_id",
                    "title": "$latest_title",
                    "price": "$latest_price",
                    "last_crawl": 1,
                    "_id": 0
                }}
            ]
            
            cursor = self.db.snapshots.aggregate(pipeline)
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Failed to get all products: {e}")
            return []
    
    async def search_products(self, keyword: str, platform: Optional[Platform] = None) -> List[Dict]:
        """搜索商品"""
        try:
            query = {"title": {"$regex": keyword, "$options": "i"}}
            if platform:
                query["platform"] = platform.value
            
            cursor = self.db.snapshots.find(
                query,
                {"platform": 1, "product_id": 1, "title": 1, "price": 1, "crawl_time": 1}
            ).sort("crawl_time", -1).limit(50)
            
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Failed to search products: {e}")
            return []


# 单例存储实例
_storage_instance: Optional[Storage] = None


async def get_storage() -> Storage:
    """获取存储实例"""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = Storage()
        await _storage_instance.connect()
    return _storage_instance


async def close_storage():
    """关闭存储连接"""
    global _storage_instance
    if _storage_instance:
        await _storage_instance.close()
        _storage_instance = None
