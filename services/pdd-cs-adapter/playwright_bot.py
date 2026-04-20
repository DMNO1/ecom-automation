"""
浏览器自动化
使用Playwright处理拼多多工作台
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

# 导入配置和消息处理器
try:
    from .config import settings
    from .message_handler import MessageContext, MessageHandler
except ImportError:
    # 当直接运行时
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from config import settings
    from message_handler import MessageContext, MessageHandler

logger = logging.getLogger(__name__)


class PlaywrightBot:
    """Playwright自动化机器人"""
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.is_logged_in = False
        self.message_handler: Optional[MessageHandler] = None
    
    async def start(self):
        """启动浏览器"""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=settings.BROWSER_HEADLESS,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            self.context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            self.page = await self.context.new_page()
            logger.info("浏览器启动成功")
        except Exception as e:
            logger.error(f"浏览器启动失败: {e}")
            raise
    
    async def close(self):
        """关闭浏览器"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("浏览器已关闭")
        except Exception as e:
            logger.error(f"关闭浏览器时出错: {e}")

    
    async def login(self) -> bool:
        """登录拼多多工作台"""
        if not self.page:
            await self.start()
        
        try:
            logger.info("正在访问拼多多工作台...")
            await self.page.goto(settings.PDD_WORKBENCH_URL, wait_until='networkidle')
            
            # 检查是否已经登录
            if await self.page.locator('.user-avatar').count() > 0:
                logger.info("已经登录")
                self.is_logged_in = True
                return True
            
            # 需要登录
            if not settings.PDD_USERNAME or not settings.PDD_PASSWORD:
                logger.error("未配置登录凭据")
                return False
            
            # 输入用户名密码
            username_input = self.page.locator('input[name="username"]')
            password_input = self.page.locator('input[name="password"]')
            login_button = self.page.locator('button[type="submit"]')
            
            await username_input.fill(settings.PDD_USERNAME)
            await password_input.fill(settings.PDD_PASSWORD)
            await login_button.click()
            
            # 等待登录完成
            await self.page.wait_for_selector('.user-avatar', timeout=30000)
            logger.info("登录成功")
            self.is_logged_in = True
            return True
            
        except Exception as e:
            logger.error(f"登录失败: {e}")
            return False
    
    async def navigate_to_customer_service(self):
        """导航到客服页面"""
        if not self.is_logged_in:
            success = await self.login()
            if not success:
                raise Exception("无法登录")
        
        try:
            # 点击客服图标或导航到客服页面
            customer_service_link = self.page.locator('text=客服')
            if await customer_service_link.count() > 0:
                await customer_service_link.click()
                await self.page.wait_for_load_state('networkidle')
                logger.info("已进入客服页面")
            else:
                # 直接导航到客服URL
                await self.page.goto(f"{settings.PDD_WORKBENCH_URL}/chat", wait_until='networkidle')
        except Exception as e:
            logger.error(f"导航到客服页面失败: {e}")
            raise
    
    async def get_unread_messages(self) -> List[Dict[str, Any]]:
        """获取未读消息列表"""
        try:
            # 等待消息列表加载
            await self.page.wait_for_selector('.conversation-list', timeout=10000)
            
            # 获取所有会话项
            conversation_items = self.page.locator('.conversation-item')
            count = await conversation_items.count()
            
            messages = []
            for i in range(count):
                item = conversation_items.nth(i)
                
                # 检查是否有未读标记
                unread_badge = item.locator('.unread-badge')
                if await unread_badge.count() > 0:
                    # 提取信息
                    user_name = await item.locator('.user-name').text_content()
                    last_message = await item.locator('.last-message').text_content()
                    time_text = await item.locator('.time').text_content()
                    
                    messages.append({
                        'index': i,
                        'user_name': user_name,
                        'last_message': last_message,
                        'time': time_text
                })
            
            logger.info(f"找到 {len(messages)} 条未读消息")
            return messages
            
        except Exception as e:
            logger.error(f"获取未读消息失败: {e}")
            return []
    
    async def read_conversation_messages(self, conversation_index: int) -> List[Dict[str, Any]]:
        """读取会话中的消息"""
        try:
            # 点击会话
            conversation_items = self.page.locator('.conversation-item')
            await conversation_items.nth(conversation_index).click()
            
            # 等待消息加载
            await self.page.wait_for_selector('.message-list', timeout=10000)
            
            # 获取消息列表
            message_items = self.page.locator('.message-item')
            count = await message_items.count()
            
            messages = []
            for i in range(count):
                item = message_items.nth(i)
                content = await item.locator('.message-content').text_content()
                sender = await item.locator('.sender').text_content()
                time_text = await item.locator('.time').text_content()
                
                messages.append({
                    'content': content,
                    'sender': sender,
                    'time': time_text
                })
            
            return messages
            
        except Exception as e:
            logger.error(f"读取会话消息失败: {e}")
            return []
    
    async def send_reply(self, conversation_index: int, content: str) -> bool:
        """发送回复"""
        try:
            # 确保在正确的会话
            conversation_items = self.page.locator('.conversation-item')
            await conversation_items.nth(conversation_index).click()
            
            # 输入回复内容
            input_box = self.page.locator('.chat-input textarea')
            await input_box.fill(content)
            
            # 点击发送按钮
            send_button = self.page.locator('.send-button')
            await send_button.click()
            
            logger.info(f"发送回复成功: {content[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"发送回复失败: {e}")
            return False
    
    async def auto_reply_loop(self, message_handler: MessageHandler):
        """自动回复循环"""
        self.message_handler = message_handler
        
        try:
            while True:
                # 获取未读消息
                unread_messages = await self.get_unread_messages()
                
                for msg_info in unread_messages:
                    # 读取完整消息
                    messages = await self.read_conversation_messages(msg_info['index'])
                    
                    # 处理最后一条消息
                    if messages:
                        last_msg = messages[-1]
                        message_ctx = MessageContext(
                            conversation_id=str(msg_info['index']),
                            message_id=f"{msg_info['index']}_{len(messages)}",
                            content=last_msg['content'],
                            sender_id=msg_info['user_name'],
                            sender_name=msg_info['user_name'],
                            timestamp=0  # 实际应解析时间
                        )
                        
                        # 处理消息
                        result = await message_handler.process_message(message_ctx)
                        
                        # 如果有自动回复，发送回复
                        if result.auto_reply and not result.need_human:
                            await self.send_reply(msg_info['index'], result.auto_reply)
                        elif result.need_human:
                            # 标记需要人工处理
                            logger.warning(f"会话 {msg_info['index']} 需要人工处理")
                
                # 等待一段时间再检查
                await asyncio.sleep(settings.POLL_INTERVAL)
                
        except asyncio.CancelledError:
            logger.info("自动回复循环已取消")
        except Exception as e:
            logger.error(f"自动回复循环出错: {e}")
    
    async def take_screenshot(self, path: str = "screenshot.png"):
        """截图"""
        if self.page:
            await self.page.screenshot(path=path)
            logger.info(f"截图已保存: {path}")


# 创建全局机器人实例
playwright_bot = PlaywrightBot()
