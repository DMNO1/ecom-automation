"""
消息管理路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

try:
    from ..xianyu_client import client_manager, XianyuMessage
    from ..auto_reply import auto_reply_manager, ReplyRule, AIConfig
except ImportError:
    from xianyu_client import client_manager, XianyuMessage
    from auto_reply import auto_reply_manager, ReplyRule, AIConfig

router = APIRouter()


class MessageResponse(BaseModel):
    """消息响应"""
    message_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime
    is_read: bool
    conversation_id: Optional[str]


class SendMessageRequest(BaseModel):
    """发送消息请求"""
    account_id: str
    conversation_id: str
    content: str


class AutoReplyConfigRequest(BaseModel):
    """自动回复配置请求"""
    account_id: str
    enabled: bool = True
    interval: int = 30  # 检查间隔（秒）


class ReplyRuleRequest(BaseModel):
    """回复规则请求"""
    id: str
    name: str
    pattern: str
    reply_content: str
    priority: int = 0
    is_active: bool = True
    match_type: str = "exact"  # exact, regex, keyword


class AIConfigRequest(BaseModel):
    """AI配置请求"""
    account_id: str
    api_key: str
    model: str = "gpt-3.5-turbo"
    max_tokens: int = 1000
    temperature: float = 0.7
    system_prompt: str = "你是一个闲鱼卖家助手，负责自动回复买家的消息。"


@router.get("/{account_id}", response_model=List[MessageResponse])
async def get_messages(
    account_id: str,
    limit: int = Query(50, ge=1, le=200),
):
    """获取消息列表"""
    try:
        client = await client_manager.get_client(account_id)
        messages = await client.get_messages(limit=limit)
        
        return [
            MessageResponse(
                message_id=msg.message_id,
                sender_id=msg.sender_id,
                sender_name=msg.sender_name,
                content=msg.content,
                timestamp=msg.timestamp,
                is_read=msg.is_read,
                conversation_id=msg.conversation_id,
            )
            for msg in messages
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send")
async def send_message(request: SendMessageRequest):
    """发送消息"""
    try:
        client = await client_manager.get_client(request.account_id)
        success = await client.send_message(
            conversation_id=request.conversation_id,
            content=request.content,
        )
        
        if success:
            return {"message": "发送成功"}
        else:
            raise HTTPException(status_code=500, detail="发送失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-reply/config")
async def configure_auto_reply(request: AutoReplyConfigRequest):
    """配置自动回复"""
    try:
        client = await client_manager.get_client(request.account_id)
        engine = await auto_reply_manager.get_engine(request.account_id, client)
        
        if request.enabled:
            # 启动自动回复监控
            await auto_reply_manager.start_monitoring(client, interval=request.interval)
            return {"message": "自动回复已启动"}
        else:
            # 停止自动回复监控
            await auto_reply_manager.stop_monitoring()
            return {"message": "自动回复已停止"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auto-reply/rules/{account_id}", response_model=List[ReplyRuleRequest])
async def get_reply_rules(account_id: str):
    """获取回复规则"""
    try:
        client = await client_manager.get_client(account_id)
        engine = await auto_reply_manager.get_engine(account_id, client)
        rules = await engine.get_rules()
        
        return [
            ReplyRuleRequest(
                id=rule.id,
                name=rule.name,
                pattern=rule.pattern,
                reply_content=rule.reply_content,
                priority=rule.priority,
                is_active=rule.is_active,
                match_type=rule.match_type,
            )
            for rule in rules
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-reply/rules/{account_id}")
async def add_reply_rule(account_id: str, request: ReplyRuleRequest):
    """添加回复规则"""
    try:
        client = await client_manager.get_client(account_id)
        engine = await auto_reply_manager.get_engine(account_id, client)
        
        rule = ReplyRule(
            id=request.id,
            name=request.name,
            pattern=request.pattern,
            reply_content=request.reply_content,
            priority=request.priority,
            is_active=request.is_active,
            match_type=request.match_type,
            created_at=datetime.now(),
        )
        
        success = await engine.add_rule(rule)
        
        if success:
            return {"message": "规则添加成功"}
        else:
            raise HTTPException(status_code=400, detail="规则添加失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/auto-reply/rules/{account_id}/{rule_id}")
async def remove_reply_rule(account_id: str, rule_id: str):
    """删除回复规则"""
    try:
        client = await client_manager.get_client(account_id)
        engine = await auto_reply_manager.get_engine(account_id, client)
        
        success = await engine.remove_rule(rule_id)
        
        if success:
            return {"message": "规则删除成功"}
        else:
            raise HTTPException(status_code=404, detail="规则不存在")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/auto-reply/rules/{account_id}/{rule_id}")
async def update_reply_rule(account_id: str, rule_id: str, request: ReplyRuleRequest):
    """更新回复规则"""
    try:
        client = await client_manager.get_client(account_id)
        engine = await auto_reply_manager.get_engine(account_id, client)
        
        updates = {
            "name": request.name,
            "pattern": request.pattern,
            "reply_content": request.reply_content,
            "priority": request.priority,
            "is_active": request.is_active,
            "match_type": request.match_type,
        }
        
        success = await engine.update_rule(rule_id, updates)
        
        if success:
            return {"message": "规则更新成功"}
        else:
            raise HTTPException(status_code=404, detail="规则不存在")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-reply/ai-config/{account_id}")
async def configure_ai(account_id: str, request: AIConfigRequest):
    """配置AI回复"""
    try:
        client = await client_manager.get_client(account_id)
        engine = await auto_reply_manager.get_engine(account_id, client)
        
        ai_config = AIConfig(
            api_key=request.api_key,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            system_prompt=request.system_prompt,
        )
        
        success = await engine.set_ai_config(ai_config)
        
        if success:
            return {"message": "AI配置成功"}
        else:
            raise HTTPException(status_code=500, detail="AI配置失败")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/auto-reply/history/{account_id}")
async def clear_conversation_history(account_id: str, conversation_id: Optional[str] = None):
    """清空对话历史"""
    try:
        client = await client_manager.get_client(account_id)
        engine = await auto_reply_manager.get_engine(account_id, client)
        
        await engine.clear_conversation_history(conversation_id)
        
        return {"message": "对话历史已清空"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))