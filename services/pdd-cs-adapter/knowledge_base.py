"""
客服知识库集成
管理FAQ、常见问题、标准回复等
"""
import json
import logging
import os
from typing import Dict, Any, List, Optional
from pathlib import Path
import aiofiles

# 导入配置
try:
    from .config import settings
except ImportError:
    # 当直接运行时
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from config import settings

logger = logging.getLogger(__name__)


class KnowledgeBase:
    """客服知识库"""
    
    def __init__(self, knowledge_base_path: Optional[str] = None):
        self.knowledge_base_path = knowledge_base_path or settings.KNOWLEDGE_BASE_PATH
        self.faq_items: List[Dict[str, Any]] = []
        self.keyword_index: Dict[str, List[int]] = {}
        self.is_loaded = False
    
    async def load(self):
        """加载知识库"""
        try:
            if not os.path.exists(self.knowledge_base_path):
                logger.warning(f"知识库文件不存在: {self.knowledge_base_path}")
                await self._create_default_knowledge_base()
                return
            
            async with aiofiles.open(self.knowledge_base_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                data = json.loads(content)
                self.faq_items = data.get('faq_items', [])
            
            # 构建关键词索引
            self._build_keyword_index()
            self.is_loaded = True
            logger.info(f"知识库加载成功，共 {len(self.faq_items)} 条FAQ")
            
        except Exception as e:
            logger.error(f"加载知识库失败: {e}")
            await self._create_default_knowledge_base()
    
    async def _create_default_knowledge_base(self):
        """创建默认知识库"""
        default_faq = [
            {
                "id": "faq_001",
                "question": "发货时间",
                "answer": "您好，我们会在48小时内发货，请您耐心等待。如有特殊情况，我们会及时通知您。",
                "keywords": ["发货", "什么时候发", "多久发货", "发货时间"],
                "category": "物流"
            },
            {
                "id": "faq_002",
                "question": "物流查询",
                "answer": "您好，您可以在订单详情中查看物流信息。如果长时间没有更新，建议联系物流公司查询。",
                "keywords": ["物流", "快递", "到哪了", "物流信息", "查询物流"],
                "category": "物流"
            },
            {
                "id": "faq_003",
                "question": "退货流程",
                "answer": "您好，退货流程如下：\n1. 在订单中申请退货\n2. 等待商家审核\n3. 审核通过后寄回商品\n4. 商家确认收货后退款",
                "keywords": ["退货", "退款", "怎么退", "退货流程"],
                "category": "售后"
            },
            {
                "id": "faq_004",
                "question": "优惠券使用",
                "answer": "您好，优惠券使用方法：\n1. 在结算页面选择可用优惠券\n2. 确认优惠金额\n3. 完成支付即可享受优惠",
                "keywords": ["优惠券", "怎么用优惠券", "优惠", "折扣"],
                "category": "促销"
            },
            {
                "id": "faq_005",
                "question": "商品质量",
                "answer": "您好，我们保证所有商品均为正品，如有质量问题，请在签收后7天内联系我们处理。",
                "keywords": ["质量", "正品", "假货", "质量保证"],
                "category": "商品"
            }
        ]
        
        self.faq_items = default_faq
        self._build_keyword_index()
        
        # 保存默认知识库
        await self.save()
        self.is_loaded = True
        logger.info("已创建默认知识库")
    
    def _build_keyword_index(self):
        """构建关键词索引"""
        self.keyword_index = {}
        
        for idx, item in enumerate(self.faq_items):
            for keyword in item.get('keywords', []):
                if keyword not in self.keyword_index:
                    self.keyword_index[keyword] = []
                self.keyword_index[keyword].append(idx)
    
    async def find_answer(self, question: str) -> Optional[str]:
        """查找答案"""
        if not self.is_loaded:
            await self.load()
        
        question_lower = question.lower()
        
        # 1. 精确匹配
        for item in self.faq_items:
            if item['question'].lower() in question_lower:
                return item['answer']
        
        # 2. 关键词匹配
        matched_items = []
        for keyword, indices in self.keyword_index.items():
            if keyword in question:
                for idx in indices:
                    if idx not in [m[0] for m in matched_items]:
                        matched_items.append((idx, len(keyword)))
        
        if matched_items:
            # 按关键词长度排序，选择最匹配的
            matched_items.sort(key=lambda x: x[1], reverse=True)
            best_match_idx = matched_items[0][0]
            return self.faq_items[best_match_idx]['answer']
        
        # 3. 模糊匹配（简单实现）
        for item in self.faq_items:
            for keyword in item.get('keywords', []):
                if keyword in question:
                    return item['answer']
        
        return None
    
    async def add_faq(self, question: str, answer: str, keywords: List[str], category: str = "其他", defer_save: bool = False):
        """添加FAQ"""
        if not self.is_loaded:
            await self.load()
        
        new_id = f"faq_{len(self.faq_items) + 1:03d}"
        
        new_item = {
            "id": new_id,
            "question": question,
            "answer": answer,
            "keywords": keywords,
            "category": category
        }
        
        self.faq_items.append(new_item)

        if not defer_save:
            self._build_keyword_index()
            await self.save()
        
        logger.info(f"添加新FAQ: {new_id}")
        return new_id
    
    async def update_faq(self, faq_id: str, defer_save: bool = False, **kwargs):
        """更新FAQ"""
        if not self.is_loaded:
            await self.load()
        
        for item in self.faq_items:
            if item['id'] == faq_id:
                item.update(kwargs)
                if not defer_save:
                    self._build_keyword_index()
                    await self.save()
                logger.info(f"更新FAQ: {faq_id}")
                return True
        
        logger.warning(f"未找到FAQ: {faq_id}")
        return False
    
    async def delete_faq(self, faq_id: str, defer_save: bool = False):
        """删除FAQ"""
        if not self.is_loaded:
            await self.load()
        
        original_count = len(self.faq_items)
        self.faq_items = [item for item in self.faq_items if item['id'] != faq_id]
        
        if len(self.faq_items) < original_count:
            if not defer_save:
                self._build_keyword_index()
                await self.save()
            logger.info(f"删除FAQ: {faq_id}")
            return True
        
        logger.warning(f"未找到FAQ: {faq_id}")
        return False
    
    async def batch_add_faqs(self, faqs: List[Dict[str, Any]]) -> List[str]:
        """批量添加FAQ"""
        if not self.is_loaded:
            await self.load()

        new_ids = []
        for faq in faqs:
            new_id = await self.add_faq(
                question=faq.get('question'),
                answer=faq.get('answer'),
                keywords=faq.get('keywords', []),
                category=faq.get('category', '其他'),
                defer_save=True
            )
            new_ids.append(new_id)

        self._build_keyword_index()
        await self.save()
        return new_ids

    async def batch_update_faqs(self, updates: List[Dict[str, Any]]) -> int:
        """批量更新FAQ"""
        if not self.is_loaded:
            await self.load()

        updated_count = 0
        for update in updates:
            faq_id = update.pop('id', None)
            if not faq_id:
                continue
            success = await self.update_faq(faq_id, defer_save=True, **update)
            if success:
                updated_count += 1

        if updated_count > 0:
            self._build_keyword_index()
            await self.save()

        return updated_count

    async def batch_delete_faqs(self, faq_ids: List[str]) -> int:
        """批量删除FAQ"""
        if not self.is_loaded:
            await self.load()

        deleted_count = 0
        for faq_id in faq_ids:
            success = await self.delete_faq(faq_id, defer_save=True)
            if success:
                deleted_count += 1

        if deleted_count > 0:
            self._build_keyword_index()
            await self.save()

        return deleted_count

    async def save(self):
        """保存知识库到文件"""
        try:
            data = {
                "version": "1.0",
                "faq_items": self.faq_items
            }
            
            # 确保目录存在
            os.makedirs(os.path.dirname(self.knowledge_base_path) if os.path.dirname(self.knowledge_base_path) else '.', exist_ok=True)
            
            async with aiofiles.open(self.knowledge_base_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(data, ensure_ascii=False, indent=2))
            
            logger.info(f"知识库已保存: {self.knowledge_base_path}")
            
        except Exception as e:
            logger.error(f"保存知识库失败: {e}")
    
    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """搜索知识库"""
        if not self.is_loaded:
            await self.load()
        
        results = []
        query_lower = query.lower()
        
        for item in self.faq_items:
            score = 0
            
            # 检查问题匹配
            if query_lower in item['question'].lower():
                score += 10
            
            # 检查关键词匹配
            for keyword in item.get('keywords', []):
                if keyword in query:
                    score += 5
            
            # 检查答案匹配
            if query_lower in item['answer'].lower():
                score += 2
            
            if score > 0:
                results.append({
                    "item": item,
                    "score": score
                })
        
        # 按分数排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return [r['item'] for r in results[:limit]]
    
    async def get_categories(self) -> List[str]:
        """获取所有分类"""
        if not self.is_loaded:
            await self.load()
        
        categories = set()
        for item in self.faq_items:
            categories.add(item.get('category', '其他'))
        
        return sorted(list(categories))
    
    async def get_faq_by_category(self, category: str) -> List[Dict[str, Any]]:
        """按分类获取FAQ"""
        if not self.is_loaded:
            await self.load()
        
        return [item for item in self.faq_items if item.get('category') == category]


# 创建全局知识库实例
knowledge_base = KnowledgeBase()
