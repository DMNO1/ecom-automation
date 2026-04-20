"""
消息处理逻辑
包括自动回复、风险分级、人工转接判断
"""
import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from enum import Enum
import asyncio

# 导入配置和知识库
try:
    from .knowledge_base import KnowledgeBase
    from .config import settings
except ImportError:
    # 当直接运行时
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from knowledge_base import KnowledgeBase
    from config import settings

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """风险等级枚举"""
    LOW = "low"           # 低风险，可自动回复
    MEDIUM = "medium"     # 中风险，需要关注
    HIGH = "high"         # 高风险，需要人工介入


@dataclass
class MessageContext:
    """消息上下文"""
    conversation_id: str
    message_id: str
    content: str
    sender_id: str
    sender_name: str
    timestamp: int
    order_sn: Optional[str] = None
    product_id: Optional[str] = None


@dataclass
class ProcessResult:
    """处理结果"""
    risk_level: RiskLevel
    auto_reply: Optional[str] = None
    need_human: bool = False
    keywords_matched: List[str] = None
    faq_matched: Optional[str] = None
    order_context: Optional[Dict[str, Any]] = None


class MessageHandler:
    """消息处理器"""
    
    def __init__(self, knowledge_base: KnowledgeBase):
        self.knowledge_base = knowledge_base
        self.high_risk_keywords = settings.HIGH_RISK_KEYWORDS
        self.auto_reply_enabled = settings.AUTO_REPLY_ENABLED
        
        # 编译正则表达式
        self.order_pattern = re.compile(r'订单号[：:]\s*(\d+)')
        self.product_pattern = re.compile(r'商品[：:]\s*(\d+)')
    
    def analyze_risk(self, message: str) -> Tuple[RiskLevel, List[str]]:
        """分析消息风险等级"""
        matched_keywords = []
        message_lower = message.lower()
        
        # 检查高风险关键词
        for keyword in self.high_risk_keywords:
            if keyword in message:
                matched_keywords.append(keyword)
        
        # 根据匹配数量判断风险等级
        if len(matched_keywords) >= 2:
            return RiskLevel.HIGH, matched_keywords
        elif len(matched_keywords) == 1:
            return RiskLevel.MEDIUM, matched_keywords
        else:
            return RiskLevel.LOW, matched_keywords
    
    def extract_order_info(self, message: str) -> Tuple[Optional[str], Optional[str]]:
        """提取消息中的订单号和商品ID"""
        order_match = self.order_pattern.search(message)
        product_match = self.product_pattern.search(message)
        
        order_sn = order_match.group(1) if order_match else None
        product_id = product_match.group(1) if product_match else None
        
        return order_sn, product_id
    
    async def process_message(self, message_ctx: MessageContext) -> ProcessResult:
        """处理单条消息"""
        logger.info(f"处理消息: {message_ctx.message_id}")
        
        # 1. 分析风险等级
        risk_level, matched_keywords = self.analyze_risk(message_ctx.content)
        
        # 2. 提取订单信息
        order_sn, product_id = self.extract_order_info(message_ctx.content)
        
        # 3. 高风险消息直接转人工
        if risk_level == RiskLevel.HIGH:
            logger.warning(f"高风险消息，转人工处理: {message_ctx.message_id}")
            return ProcessResult(
                risk_level=risk_level,
                need_human=True,
                keywords_matched=matched_keywords,
                auto_reply="您的消息已收到，正在为您转接人工客服，请稍候..."
            )
        
        # 4. 低风险消息尝试自动回复
        if risk_level == RiskLevel.LOW and self.auto_reply_enabled:
            # 尝试从知识库匹配回复
            faq_reply = await self.knowledge_base.find_answer(message_ctx.content)
            
            if faq_reply:
                logger.info(f"找到FAQ回复: {message_ctx.message_id}")
                return ProcessResult(
                    risk_level=risk_level,
                    auto_reply=faq_reply,
                    faq_matched="faq",
                    need_human=False
                )
        
        # 5. 中风险或未匹配到FAQ，建议人工处理
        need_human = risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH]
        
        # 如果有订单号，可以尝试获取订单上下文
        order_context = None
        if order_sn:
            # 这里可以调用API获取订单详情
            # order_context = await self.get_order_context(order_sn)
            pass
        
        return ProcessResult(
            risk_level=risk_level,
            need_human=need_human,
            keywords_matched=matched_keywords,
            order_context=order_context,
            auto_reply="感谢您的咨询，客服正在处理中，请稍候..." if need_human else None
        )
    
    async def batch_process_messages(self, messages: List[MessageContext]) -> List[ProcessResult]:
        """批量处理消息"""
        tasks = [self.process_message(msg) for msg in messages]
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    def generate_auto_reply(self, faq_item: Dict[str, Any], order_context: Optional[Dict[str, Any]] = None) -> str:
        """生成自动回复内容"""
        reply = faq_item.get("answer", "")
        
        # 如果有订单上下文，可以个性化回复
        if order_context:
            order_status = order_context.get("order_status")
            logistics_info = order_context.get("logistics_info")
            
            if order_status:
                reply += f"\n\n您的订单状态为: {order_status}"
            
            if logistics_info:
                reply += f"\n物流信息: {logistics_info}"
        
        return reply
    
    def should_escalate_to_human(self, result: ProcessResult) -> bool:
        """判断是否需要升级到人工"""
        if result.risk_level == RiskLevel.HIGH:
            return True
        
        if result.risk_level == RiskLevel.MEDIUM and not result.auto_reply:
            return True
        
        # 可以添加更多规则
        return False


# 消息处理器工厂
def create_message_handler() -> MessageHandler:
    """创建消息处理器实例"""
    knowledge_base = KnowledgeBase()
    return MessageHandler(knowledge_base)
