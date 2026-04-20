"""
知识库管理模块
管理4类知识库：商品/售后/规则/话术
"""
import json
import os
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel
from loguru import logger

class KnowledgeItem(BaseModel):
    """知识条目模型"""
    id: str
    domain: str  # product, aftersale, rules, scripts
    category: str
    question: str
    answer: str
    keywords: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class KnowledgeBase:
    """知识库管理类"""
    
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.domains = ["product", "aftersale", "rules", "scripts"]
        self._init_storage()
    
    def _init_storage(self):
        """初始化存储结构"""
        for domain in self.domains:
            domain_dir = os.path.join(self.data_dir, domain)
            os.makedirs(domain_dir, exist_ok=True)
            
            # 创建示例数据文件（如果不存在）
            data_file = os.path.join(domain_dir, "knowledge.json")
            if not os.path.exists(data_file):
                self._create_sample_data(domain, data_file)
    
    def _create_sample_data(self, domain: str, file_path: str):
        """创建示例数据"""
        sample_data = {
            "product": [
                {
                    "id": "prod_001",
                    "domain": "product",
                    "category": "电子产品",
                    "question": "这款手机电池续航怎么样？",
                    "answer": "这款手机配备5000mAh大电池，支持67W快充，正常使用可达1.5天续航。",
                    "keywords": ["电池", "续航", "充电", "快充"],
                    "metadata": {"brand": "示例品牌", "model": "X100"}
                },
                {
                    "id": "prod_002",
                    "domain": "product",
                    "category": "服装",
                    "question": "这件衣服怎么洗涤保养？",
                    "answer": "建议冷水手洗，避免暴晒，不可漂白，中温熨烫。",
                    "keywords": ["洗涤", "保养", "护理"],
                    "metadata": {"material": "棉质"}
                }
            ],
            "aftersale": [
                {
                    "id": "aft_001",
                    "domain": "aftersale",
                    "category": "退换货",
                    "question": "7天无理由退货怎么操作？",
                    "answer": "请在签收7天内，保持商品原样，联系客服申请退货，运费由买家承担。",
                    "keywords": ["退货", "7天", "无理由"],
                    "metadata": {"policy": "7天无理由退货"}
                },
                {
                    "id": "aft_002",
                    "domain": "aftersale",
                    "category": "保修",
                    "question": "商品保修期是多久？",
                    "answer": "电子产品保修1年，家电保修3年，具体以商品详情页标注为准。",
                    "keywords": ["保修", "维修", "售后"],
                    "metadata": {"warranty": "1-3年"}
                }
            ],
            "rules": [
                {
                    "id": "rule_001",
                    "domain": "rules",
                    "category": "平台规则",
                    "question": "哪些商品禁止在平台销售？",
                    "answer": "违禁品、假冒伪劣商品、侵犯知识产权商品、管制刀具等禁止销售。",
                    "keywords": ["禁止", "违禁", "违规"],
                    "metadata": {"source": "平台规则第3章"}
                },
                {
                    "id": "rule_002",
                    "domain": "rules",
                    "category": "交易规则",
                    "question": "发货时效要求是什么？",
                    "answer": "普通订单需48小时内发货，预售商品按约定时间发货，超时将自动赔付。",
                    "keywords": ["发货", "时效", "48小时"],
                    "metadata": {"deadline": "48小时"}
                }
            ],
            "scripts": [
                {
                    "id": "script_001",
                    "domain": "scripts",
                    "category": "问候语",
                    "question": "客户首次咨询怎么回复？",
                    "answer": "亲，您好！欢迎光临本店，我是客服小助手，很高兴为您服务，请问有什么可以帮您？",
                    "keywords": ["问候", "欢迎", "首次咨询"],
                    "metadata": {"scene": "首次咨询"}
                },
                {
                    "id": "script_002",
                    "domain": "scripts",
                    "category": "催付话术",
                    "question": "客户未付款怎么催付？",
                    "answer": "亲，您看中的商品库存有限，建议尽快下单哦！现在付款还能享受专属优惠呢～",
                    "keywords": ["催付", "未付款", "提醒"],
                    "metadata": {"scene": "未付款提醒"}
                }
            ]
        }
        
        if domain in sample_data:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(sample_data[domain], f, ensure_ascii=False, indent=2)
            logger.info(f"Created sample data for domain: {domain}")
    
    def load_knowledge(self, domain: str) -> List[KnowledgeItem]:
        """加载指定领域的知识库"""
        if domain not in self.domains:
            raise ValueError(f"Invalid domain: {domain}. Valid domains: {self.domains}")
        
        data_file = os.path.join(self.data_dir, domain, "knowledge.json")
        if not os.path.exists(data_file):
            return []
        
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return [KnowledgeItem(**item) for item in data]
        except Exception as e:
            logger.error(f"Error loading knowledge for {domain}: {e}")
            return []
    
    def save_knowledge(self, domain: str, items: List[KnowledgeItem]):
        """保存知识条目"""
        if domain not in self.domains:
            raise ValueError(f"Invalid domain: {domain}")
        
        data_file = os.path.join(self.data_dir, domain, "knowledge.json")
        try:
            data = [item.dict() for item in items]
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            logger.info(f"Saved {len(items)} items for domain: {domain}")
        except Exception as e:
            logger.error(f"Error saving knowledge for {domain}: {e}")
            raise
    
    def add_item(self, domain: str, item: KnowledgeItem) -> bool:
        """添加知识条目"""
        try:
            items = self.load_knowledge(domain)
            # 检查ID是否重复
            if any(existing.id == item.id for existing in items):
                logger.warning(f"Item with ID {item.id} already exists in {domain}")
                return False
            
            items.append(item)
            self.save_knowledge(domain, items)
            return True
        except Exception as e:
            logger.error(f"Error adding item to {domain}: {e}")
            return False
    
    def update_item(self, domain: str, item_id: str, updated_item: KnowledgeItem) -> bool:
        """更新知识条目"""
        try:
            items = self.load_knowledge(domain)
            for i, item in enumerate(items):
                if item.id == item_id:
                    updated_item.updated_at = datetime.now()
                    items[i] = updated_item
                    self.save_knowledge(domain, items)
                    return True
            logger.warning(f"Item with ID {item_id} not found in {domain}")
            return False
        except Exception as e:
            logger.error(f"Error updating item in {domain}: {e}")
            return False
    
    def delete_item(self, domain: str, item_id: str) -> bool:
        """删除知识条目"""
        try:
            items = self.load_knowledge(domain)
            original_count = len(items)
            items = [item for item in items if item.id != item_id]
            
            if len(items) < original_count:
                self.save_knowledge(domain, items)
                return True
            else:
                logger.warning(f"Item with ID {item_id} not found in {domain}")
                return False
        except Exception as e:
            logger.error(f"Error deleting item from {domain}: {e}")
            return False
    
    def get_all_domains(self) -> List[str]:
        """获取所有知识库领域"""
        return self.domains
    
    def get_stats(self) -> Dict[str, int]:
        """获取各领域知识条目统计"""
        stats = {}
        for domain in self.domains:
            items = self.load_knowledge(domain)
            stats[domain] = len(items)
        return stats

# 全局知识库实例
knowledge_base = KnowledgeBase()