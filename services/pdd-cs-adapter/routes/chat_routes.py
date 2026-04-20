"""
聊天相关API路由
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class MessageRequest(BaseModel):
    """消息请求模型"""
    content: str
    conversation_id: str
    auto_reply: bool = True


class MessageResponse(BaseModel):
    """消息响应模型"""
    message_id: str
    content: str
    risk_level: str
    auto_reply: Optional[str] = None
    need_human: bool = False
    processed_at: datetime


class ConversationInfo(BaseModel):
    """会话信息模型"""
    conversation_id: str
    user_name: str
    last_message: str
    unread_count: int
    last_active: datetime


@router.get("/conversations", response_model=List[ConversationInfo])
async def get_conversations():
    """获取会话列表"""
    # 这里应该调用拼多多API或Playwright获取真实数据
    return []


@router.post("/messages", response_model=MessageResponse)
async def process_message(request: MessageRequest):
    """处理单条消息"""
    from main import app
    message_handler = app.state.message_handler
    
    if not message_handler:
        raise HTTPException(status_code=500, detail="消息处理器未初始化")
    
    from message_handler import MessageContext
    
    message_ctx = MessageContext(
        conversation_id=request.conversation_id,
        message_id=f"msg_{datetime.now().timestamp()}",
        content=request.content,
        sender_id="user",
        sender_name="用户",
        timestamp=int(datetime.now().timestamp())
    )
    
    result = await message_handler.process_message(message_ctx)
    
    return MessageResponse(
        message_id=message_ctx.message_id,
        content=request.content,
        risk_level=result.risk_level.value,
        auto_reply=result.auto_reply,
        need_human=result.need_human,
        processed_at=datetime.now()
    )


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, limit: int = 50):
    """获取会话消息历史"""
    # 这里应该从数据库或API获取消息历史
    return {
        "conversation_id": conversation_id,
        "messages": [],
        "total": 0
    }


@router.post("/conversations/{conversation_id}/reply")
async def send_reply(conversation_id: str, content: str):
    """发送回复"""
    from main import app
    playwright_bot = app.state.playwright_bot
    
    if not playwright_bot:
        raise HTTPException(status_code=500, detail="浏览器机器人未初始化")
    
    # 这里应该调用Playwright发送回复
    return {
        "success": True,
        "conversation_id": conversation_id,
        "content": content
    }


@router.post("/auto-reply/start")
async def start_auto_reply():
    """启动自动回复"""
    from main import app
    playwright_bot = app.state.playwright_bot
    message_handler = app.state.message_handler
    
    if not playwright_bot or not message_handler:
        raise HTTPException(status_code=500, detail="组件未初始化")
    
    # 启动自动回复循环
    import asyncio
    asyncio.create_task(playwright_bot.auto_reply_loop(message_handler))
    
    return {"status": "auto_reply_started"}


@router.post("/auto-reply/stop")
async def stop_auto_reply():
    """停止自动回复"""
    # 这里应该实现停止逻辑
    return {"status": "auto_reply_stopped"}
