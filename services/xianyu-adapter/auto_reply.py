"""
自动回复引擎 - 处理闲鱼消息的自动回复
"""
import asyncio
import logging
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass

try:
    from .config import settings
    from .xianyu_client import XianyuMessage, XianyuClient
except ImportError:
    from config import settings
    from xianyu_client import XianyuMessage, XianyuClient

logger = logging.getLogger(__name__)


@dataclass
class ReplyRule:
    """回复规则"""
    id: str
    name: str
    pattern: str  # 正则表达式
    reply_content: str
    priority: int = 0
    is_active: bool = True
    match_type: str = "exact"  # exact, regex, keyword
    created_at: Optional[datetime] = None


@dataclass
class AIConfig:
    """AI配置"""
    api_key: str
    model: str = "gpt-3.5-turbo"
    max_tokens: int = 1000
    temperature: float = 0.7
    system_prompt: str = """你是一个闲鱼卖家助手，负责自动回复买家的消息。
请保持礼貌、专业，准确回答关于商品的问题。
如果遇到无法回答的问题，请引导买家联系人工客服。"""


class AutoReplyEngine:
    """自动回复引擎"""
    
    def __init__(self, client: XianyuClient):
        self.client = client
        self.rules: List[ReplyRule] = []
        self.ai_config: Optional[AIConfig] = None
        self.conversation_history: Dict[str, List[Dict[str, Any]]] = {}
        self.last_check_time: Optional[datetime] = None
        
        # 加载默认规则
        self._load_default_rules()
    
    def _load_default_rules(self):
        """加载默认回复规则"""
        default_rules = [
            ReplyRule(
                id="greeting",
                name="问候语",
                pattern=r"^(你好|hello|hi|在吗|在不在|有人吗).*$",
                reply_content="亲，您好！欢迎光临我的小店，请问有什么可以帮您的？",
                priority=10,
                match_type="regex",
            ),
            ReplyRule(
                id="price",
                name="价格咨询",
                pattern=r".*(价格|多少钱|便宜|优惠|打折|降价).*$",
                reply_content="亲，商品价格已经在页面标注了哦，目前是实价销售，谢绝还价。如有其他问题请随时咨询~",
                priority=9,
                match_type="regex",
            ),
            ReplyRule(
                id="shipping",
                name="物流咨询",
                pattern=r".*(发货|快递|物流|几天到|什么时候发).*$",
                reply_content="亲，我们会在付款后24小时内发货，默认发中通快递，一般2-4天可以到达。如有特殊需求请提前说明。",
                priority=8,
                match_type="regex",
            ),
            ReplyRule(
                id="return_policy",
                name="退换货政策",
                pattern=r".*(退货|换货|不满意|质量问题|坏了).*$",
                reply_content="亲，我们支持7天无理由退换货，如有质量问题请拍照联系客服处理。退换货运费由我们承担。",
                priority=7,
                match_type="regex",
            ),
            ReplyRule(
                id="thanks",
                name="感谢回复",
                pattern=r".*(谢谢|感谢|thanks|ok|好的|行).*$",
                reply_content="不客气！祝您购物愉快，有任何问题随时联系我们哦~",
                priority=6,
                match_type="regex",
            ),
        ]
        
        self.rules.extend(default_rules)
        logger.info(f"加载了 {len(default_rules)} 条默认回复规则")
    
    async def process_message(self, message: XianyuMessage) -> Optional[str]:
        """处理消息并生成回复"""
        try:
            # 忽略自己发送的消息
            if message.sender_id == self.client.account_id:
                return None
            
            # 忽略已读消息
            if message.is_read:
                return None
            
            logger.info(f"处理消息: {message.content[:50]}...")
            
            # 1. 尝试规则匹配
            reply = self._match_rules(message)
            if reply:
                logger.info(f"规则匹配成功: {reply[:50]}...")
                return reply
            
            # 2. 使用AI生成回复
            if self.ai_config:
                reply = await self._generate_ai_reply(message)
                if reply:
                    logger.info(f"AI生成回复: {reply[:50]}...")
                    return reply
            
            # 3. 使用默认回复
            default_reply = self._get_default_reply(message)
            logger.info(f"使用默认回复: {default_reply[:50]}...")
            return default_reply
            
        except Exception as e:
            logger.error(f"处理消息失败: {e}")
            return None
    
    def _match_rules(self, message: XianyuMessage) -> Optional[str]:
        """规则匹配"""
        # 按优先级排序
        sorted_rules = sorted(
            [r for r in self.rules if r.is_active],
            key=lambda x: x.priority,
            reverse=True,
        )
        
        for rule in sorted_rules:
            try:
                if rule.match_type == "exact":
                    if message.content.strip() == rule.pattern:
                        return rule.reply_content
                elif rule.match_type == "regex":
                    if re.search(rule.pattern, message.content, re.IGNORECASE):
                        return rule.reply_content
                elif rule.match_type == "keyword":
                    if rule.pattern.lower() in message.content.lower():
                        return rule.reply_content
            except Exception as e:
                logger.error(f"规则匹配异常: {e}")
                continue
        
        return None
    
    async def _generate_ai_reply(self, message: XianyuMessage) -> Optional[str]:
        """使用AI生成回复"""
        try:
            # 构建对话历史
            conversation_id = message.conversation_id or message.sender_id
            if conversation_id not in self.conversation_history:
                self.conversation_history[conversation_id] = []
            
            # 添加用户消息到历史
            self.conversation_history[conversation_id].append({
                "role": "user",
                "content": message.content,
                "timestamp": datetime.now().isoformat(),
            })
            
            # 限制历史长度
            max_history = 10
            if len(self.conversation_history[conversation_id]) > max_history:
                self.conversation_history[conversation_id] = \
                    self.conversation_history[conversation_id][-max_history:]
            
            # 调用AI API
            # 这里需要实现具体的AI调用逻辑
            # 例如调用OpenAI API或本地模型
            
            logger.info("需要实现AI回复逻辑")
            return None
            
        except Exception as e:
            logger.error(f"AI生成回复失败: {e}")
            return None
    
    def _get_default_reply(self, message: XianyuMessage) -> str:
        """获取默认回复"""
        return "亲，感谢您的消息！我们会尽快回复您，请稍等片刻~"
    
    async def add_rule(self, rule: ReplyRule) -> bool:
        """添加回复规则"""
        try:
            # 检查规则ID是否重复
            if any(r.id == rule.id for r in self.rules):
                logger.error(f"规则ID已存在: {rule.id}")
                return False
            
            self.rules.append(rule)
            logger.info(f"添加规则成功: {rule.name}")
            return True
            
        except Exception as e:
            logger.error(f"添加规则失败: {e}")
            return False
    
    async def remove_rule(self, rule_id: str) -> bool:
        """删除回复规则"""
        try:
            original_count = len(self.rules)
            self.rules = [r for r in self.rules if r.id != rule_id]
            
            if len(self.rules) < original_count:
                logger.info(f"删除规则成功: {rule_id}")
                return True
            else:
                logger.error(f"规则不存在: {rule_id}")
                return False
                
        except Exception as e:
            logger.error(f"删除规则失败: {e}")
            return False
    
    async def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> bool:
        """更新回复规则"""
        try:
            for rule in self.rules:
                if rule.id == rule_id:
                    for key, value in updates.items():
                        if hasattr(rule, key):
                            setattr(rule, key, value)
                    logger.info(f"更新规则成功: {rule_id}")
                    return True
            
            logger.error(f"规则不存在: {rule_id}")
            return False
            
        except Exception as e:
            logger.error(f"更新规则失败: {e}")
            return False
    
    async def set_ai_config(self, config: AIConfig) -> bool:
        """设置AI配置"""
        try:
            self.ai_config = config
            logger.info("AI配置更新成功")
            return True
            
        except Exception as e:
            logger.error(f"设置AI配置失败: {e}")
            return False
    
    async def get_rules(self) -> List[ReplyRule]:
        """获取所有规则"""
        return self.rules
    
    async def clear_conversation_history(self, conversation_id: Optional[str] = None):
        """清空对话历史"""
        if conversation_id:
            if conversation_id in self.conversation_history:
                del self.conversation_history[conversation_id]
        else:
            self.conversation_history.clear()
        
        logger.info("对话历史已清空")


# 自动回复管理器
class AutoReplyManager:
    """自动回复管理器"""
    
    def __init__(self):
        self.engines: Dict[str, AutoReplyEngine] = {}
        self.monitor_task: Optional[asyncio.Task] = None
        self.is_running = False
    
    async def get_engine(self, account_id: str, client: XianyuClient) -> AutoReplyEngine:
        """获取或创建回复引擎"""
        if account_id not in self.engines:
            engine = AutoReplyEngine(client)
            self.engines[account_id] = engine
        
        return self.engines[account_id]
    
    async def start_monitoring(self, client: XianyuClient, interval: int = 30):
        """开始监控消息"""
        if self.is_running:
            logger.warning("消息监控已在运行")
            return
        
        self.is_running = True
        self.monitor_task = asyncio.create_task(
            self._monitor_messages(client, interval)
        )
        logger.info(f"开始监控消息，间隔: {interval}秒")
    
    async def stop_monitoring(self):
        """停止监控消息"""
        self.is_running = False
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("消息监控已停止")
    
    async def _monitor_messages(self, client: XianyuClient, interval: int):
        """监控消息循环"""
        engine = await self.get_engine(client.account_id, client)
        
        while self.is_running:
            try:
                # 获取新消息
                messages = await client.get_messages(limit=20)
                
                if messages:
                    # 并发处理所有消息
                    process_tasks = [engine.process_message(msg) for msg in messages]
                    replies = await asyncio.gather(*process_tasks)
                    
                    for message, reply in zip(messages, replies):
                        if reply:
                            # 发送回复
                            success = await client.send_message(
                                conversation_id=message.conversation_id or message.sender_id,
                                content=reply,
                            )

                            if success:
                                logger.info(f"自动回复成功: {message.sender_name}")
                            else:
                                logger.error(f"自动回复失败: {message.sender_name}")
                
                # 等待下次检查
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"消息监控异常: {e}")
                await asyncio.sleep(interval)


# 全局管理器
auto_reply_manager = AutoReplyManager()