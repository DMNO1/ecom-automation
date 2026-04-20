"""
数据分析模块
价格趋势、标题变化、促销监控
"""
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import Counter

import jieba
import jieba.analyse
from loguru import logger

from storage import Storage, ProductSnapshot, Platform


@dataclass
class PriceAnalysis:
    """价格分析结果"""
    current_price: float
    min_price: float
    max_price: float
    avg_price: float
    price_change: float  # 价格变动
    price_change_percent: float  # 价格变动百分比
    trend: str  # up, down, stable
    volatility: float  # 价格波动率


@dataclass
class TitleChange:
    """标题变化"""
    old_title: str
    new_title: str
    change_time: datetime
    added_keywords: List[str]
    removed_keywords: List[str]


@dataclass
class PromotionAlert:
    """促销提醒"""
    product_id: str
    platform: Platform
    promotion_type: str  # 优惠券、满减、折扣等
    promotion_detail: str
    start_time: datetime
    savings: Optional[float] = None


class DataAnalyzer:
    """数据分析器"""
    
    # 促销关键词
    PROMOTION_KEYWORDS = [
        '优惠券', '满减', '折扣', '特价', '秒杀', '限时', '直降',
        '返现', '红包', '补贴', '买一送一', '第二件半价', '新人价',
        '会员价', '拼团', '百亿补贴', '9.9包邮', '清仓', '大促'
    ]
    
    # 评论高频词（电商常见）
    COMMENT_KEYWORDS = [
        '质量好', '物流快', '包装好', '性价比高', '正品', '实惠',
        '不满意', '退货', '假货', '做工差', '色差', '尺码不准',
        '味道好', '口感好', '新鲜', '分量足', '味道淡', '太甜'
    ]
    
    def __init__(self, storage: Storage):
        self.storage = storage
    
    async def analyze_price_trend(self, platform: Platform, product_id: str, 
                                  days: int = 30) -> PriceAnalysis:
        """分析价格趋势"""
        try:
            # 获取价格历史
            history = await self.storage.get_price_history(platform, product_id, days)
            
            if not history:
                raise ValueError(f"No price history found for {platform.value}/{product_id}")
            
            prices = [record['price'] for record in history]
            
            if len(prices) < 2:
                return PriceAnalysis(
                    current_price=prices[0],
                    min_price=prices[0],
                    max_price=prices[0],
                    avg_price=prices[0],
                    price_change=0,
                    price_change_percent=0,
                    trend="stable",
                    volatility=0
                )
            
            # 计算统计指标
            current_price = prices[-1]
            min_price = min(prices)
            max_price = max(prices)
            avg_price = sum(prices) / len(prices)
            
            # 价格变动
            price_change = current_price - prices[0]
            price_change_percent = (price_change / prices[0]) * 100 if prices[0] != 0 else 0
            
            # 趋势判断
            if price_change_percent > 5:
                trend = "up"
            elif price_change_percent < -5:
                trend = "down"
            else:
                trend = "stable"
            
            # 波动率计算（标准差/平均值）
            variance = sum((p - avg_price) ** 2 for p in prices) / len(prices)
            std_dev = variance ** 0.5
            volatility = (std_dev / avg_price) * 100 if avg_price != 0 else 0
            
            return PriceAnalysis(
                current_price=current_price,
                min_price=min_price,
                max_price=max_price,
                avg_price=avg_price,
                price_change=price_change,
                price_change_percent=price_change_percent,
                trend=trend,
                volatility=volatility
            )
            
        except Exception as e:
            logger.error(f"Failed to analyze price trend: {e}")
            raise
    
    async def detect_title_changes(self, platform: Platform, product_id: str,
                                   days: int = 7) -> List[TitleChange]:
        """检测标题变化"""
        try:
            from datetime import timedelta
            start_date = datetime.now() - timedelta(days=days)
            
            # 获取指定时间范围内的快照
            cursor = self.storage.db.snapshots.find(
                {
                    "platform": platform.value,
                    "product_id": product_id,
                    "crawl_time": {"$gte": start_date}
                },
                {"title": 1, "crawl_time": 1}
            ).sort("crawl_time", 1)
            
            snapshots = await cursor.to_list(length=None)
            
            if len(snapshots) < 2:
                return []
            
            changes = []
            for i in range(1, len(snapshots)):
                old_title = snapshots[i-1]['title']
                new_title = snapshots[i]['title']
                
                if old_title != new_title:
                    # 提取关键词
                    old_keywords = set(jieba.cut(old_title))
                    new_keywords = set(jieba.cut(new_title))
                    
                    added = list(new_keywords - old_keywords)
                    removed = list(old_keywords - new_keywords)
                    
                    changes.append(TitleChange(
                        old_title=old_title,
                        new_title=new_title,
                        change_time=snapshots[i]['crawl_time'],
                        added_keywords=added,
                        removed_keywords=removed
                    ))
            
            return changes
            
        except Exception as e:
            logger.error(f"Failed to detect title changes: {e}")
            return []
    
    async def monitor_promotions(self, platform: Platform, 
                                 product_id: str) -> List[PromotionAlert]:
        """监控促销活动"""
        try:
            latest = await self.storage.get_latest_snapshot(platform, product_id)
            if not latest:
                return []
            
            alerts = []
            
            # 检查促销标签
            for tag in latest.promotion_tags:
                promotion_type = self._classify_promotion(tag)
                if promotion_type:
                    savings = self._estimate_savings(latest.price, latest.original_price)
                    
                    alerts.append(PromotionAlert(
                        product_id=product_id,
                        platform=platform,
                        promotion_type=promotion_type,
                        promotion_detail=tag,
                        start_time=latest.crawl_time,
                        savings=savings
                    ))
            
            # 检查价格异常（大幅降价）
            if latest.original_price and latest.original_price > 0:
                discount = (1 - latest.price / latest.original_price) * 100
                if discount > 30:  # 折扣超过30%
                    alerts.append(PromotionAlert(
                        product_id=product_id,
                        platform=platform,
                        promotion_type="deep_discount",
                        promotion_detail=f"降价{discount:.1f}%",
                        start_time=latest.crawl_time,
                        savings=latest.original_price - latest.price
                    ))
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to monitor promotions: {e}")
            return []
    
    def _classify_promotion(self, tag: str) -> Optional[str]:
        """分类促销类型"""
        tag_lower = tag.lower()
        
        if '券' in tag or 'coupon' in tag_lower:
            return "coupon"
        elif '满减' in tag or '满' in tag:
            return "full_reduction"
        elif '折扣' in tag or '折' in tag:
            return "discount"
        elif '秒杀' in tag or '限时' in tag:
            return "flash_sale"
        elif '补贴' in tag:
            return "subsidy"
        elif '返' in tag:
            return "cashback"
        else:
            return None
    
    def _estimate_savings(self, current_price: float, 
                         original_price: Optional[float]) -> Optional[float]:
        """估算节省金额"""
        if original_price and original_price > current_price:
            return original_price - current_price
        return None
    
    async def extract_comment_keywords(self, comments: List[str], 
                                       top_k: int = 10) -> List[Tuple[str, int]]:
        """提取评论关键词"""
        try:
            # 合并所有评论
            all_text = ' '.join(comments)
            
            # 使用jieba提取关键词
            keywords = jieba.analyse.extract_tags(all_text, topK=top_k, withWeight=True)
            
            # 统计词频
            word_list = jieba.cut(all_text)
            word_count = Counter(word_list)
            
            # 过滤常见停用词
            stop_words = {'的', '了', '是', '我', '在', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
            
            result = []
            for word, weight in keywords:
                if word not in stop_words and len(word) > 1:
                    count = word_count.get(word, 0)
                    result.append((word, count))
            
            return sorted(result, key=lambda x: x[1], reverse=True)[:top_k]
            
        except Exception as e:
            logger.error(f"Failed to extract comment keywords: {e}")
            return []
    
    async def generate_competitive_report(self, product_id: str, 
                                          platforms: List[Platform]) -> Dict:
        """生成竞品分析报告"""
        report = {
            "product_id": product_id,
            "generated_at": datetime.now().isoformat(),
            "platforms": {}
        }
        
        for platform in platforms:
            try:
                # 获取最新快照
                latest = await self.storage.get_latest_snapshot(platform, product_id)
                if not latest:
                    continue
                
                # 分析价格趋势
                price_analysis = await self.analyze_price_trend(platform, product_id, days=30)
                
                # 检测标题变化
                title_changes = await self.detect_title_changes(platform, product_id, days=7)
                
                # 监控促销
                promotions = await self.monitor_promotions(platform, product_id)
                
                report["platforms"][platform.value] = {
                    "latest_snapshot": {
                        "title": latest.title,
                        "price": latest.price,
                        "crawl_time": latest.crawl_time.isoformat()
                    },
                    "price_analysis": {
                        "current": price_analysis.current_price,
                        "min": price_analysis.min_price,
                        "max": price_analysis.max_price,
                        "avg": price_analysis.avg_price,
                        "trend": price_analysis.trend,
                        "volatility": price_analysis.volatility
                    },
                    "title_changes": len(title_changes),
                    "active_promotions": len(promotions)
                }
                
            except Exception as e:
                logger.error(f"Failed to analyze {platform.value}: {e}")
                report["platforms"][platform.value] = {"error": str(e)}
        
        return report


# 工具函数
def calculate_image_similarity(hash1: str, hash2: str) -> float:
    """计算图片相似度（基于感知哈希）"""
    if len(hash1) != len(hash2):
        return 0.0
    
    # 计算汉明距离
    hamming_distance = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
    max_distance = len(hash1)
    
    # 转换为相似度百分比
    similarity = (max_distance - hamming_distance) / max_distance * 100
    return similarity


def detect_price_anomaly(prices: List[float], threshold: float = 2.0) -> List[int]:
    """检测价格异常点"""
    if len(prices) < 3:
        return []
    
    mean = sum(prices) / len(prices)
    variance = sum((p - mean) ** 2 for p in prices) / len(prices)
    std_dev = variance ** 0.5
    
    anomalies = []
    for i, price in enumerate(prices):
        z_score = abs(price - mean) / std_dev if std_dev > 0 else 0
        if z_score > threshold:
            anomalies.append(i)
    
    return anomalies
