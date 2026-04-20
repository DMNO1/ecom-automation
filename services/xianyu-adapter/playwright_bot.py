"""
浏览器自动化底座 - 基于Playwright的浏览器操作封装
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
import json

logger = logging.getLogger(__name__)

# 尝试导入playwright
try:
    from playwright.async_api import async_playwright, Browser, BrowserContext, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright未安装，浏览器自动化功能不可用")


class PlaywrightBot:
    """Playwright浏览器自动化封装"""
    
    def __init__(self, headless: bool = True, user_data_dir: Optional[str] = None):
        self.headless = headless
        self.user_data_dir = user_data_dir
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.is_running = False
        
        # 配置
        self.config = {
            "viewport": {"width": 1280, "height": 720},
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "timeout": 30000,  # 30秒超时
        }
    
    async def start(self) -> bool:
        """启动浏览器"""
        if not PLAYWRIGHT_AVAILABLE:
            logger.error("Playwright未安装")
            return False
        
        try:
            self.playwright = await async_playwright().start()
            
            # 启动浏览器
            if self.user_data_dir:
                # 使用持久化上下文
                self.context = await self.playwright.chromium.launch_persistent_context(
                    user_data_dir=self.user_data_dir,
                    headless=self.headless,
                    viewport=self.config["viewport"],
                    user_agent=self.config["user_agent"],
                )
                self.page = await self.context.new_page()
            else:
                # 普通浏览器实例
                self.browser = await self.playwright.chromium.launch(headless=self.headless)
                self.context = await self.browser.new_context(
                    viewport=self.config["viewport"],
                    user_agent=self.config["user_agent"],
                )
                self.page = await self.context.new_page()
            
            # 设置超时
            self.page.set_default_timeout(self.config["timeout"])
            
            self.is_running = True
            logger.info("浏览器启动成功")
            return True
            
        except Exception as e:
            logger.error(f"浏览器启动失败: {e}")
            await self.stop()
            return False
    
    async def stop(self):
        """停止浏览器"""
        try:
            if self.page:
                await self.page.close()
                self.page = None
            
            if self.context:
                await self.context.close()
                self.context = None
            
            if self.browser:
                await self.browser.close()
                self.browser = None
            
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
            
            self.is_running = False
            logger.info("浏览器已停止")
            
        except Exception as e:
            logger.error(f"浏览器停止失败: {e}")
    
    async def goto(self, url: str, wait_until: str = "load") -> bool:
        """导航到URL"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            response = await self.page.goto(url, wait_until=wait_until)
            
            if response and response.ok:
                logger.info(f"导航成功: {url}")
                return True
            else:
                logger.error(f"导航失败: {url}")
                return False
                
        except Exception as e:
            logger.error(f"导航异常: {e}")
            return False
    
    async def get_content(self) -> str:
        """获取页面内容"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            return await self.page.content()
            
        except Exception as e:
            logger.error(f"获取内容失败: {e}")
            return ""
    
    async def get_text(self, selector: str) -> str:
        """获取元素文本"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            element = await self.page.query_selector(selector)
            if element:
                return await element.text_content() or ""
            return ""
            
        except Exception as e:
            logger.error(f"获取文本失败: {e}")
            return ""
    
    async def click(self, selector: str) -> bool:
        """点击元素"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.click(selector)
            logger.info(f"点击成功: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"点击失败: {e}")
            return False
    
    async def fill(self, selector: str, value: str) -> bool:
        """填写表单"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.fill(selector, value)
            logger.info(f"填写成功: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"填写失败: {e}")
            return False
    
    async def type_text(self, selector: str, text: str, delay: int = 50) -> bool:
        """输入文本（模拟键盘输入）"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.type(selector, text, delay=delay)
            logger.info(f"输入成功: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"输入失败: {e}")
            return False
    
    async def select_option(self, selector: str, value: str) -> bool:
        """选择下拉选项"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.select_option(selector, value)
            logger.info(f"选择成功: {selector} = {value}")
            return True
            
        except Exception as e:
            logger.error(f"选择失败: {e}")
            return False
    
    async def upload_file(self, selector: str, file_path: str) -> bool:
        """上传文件"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.set_input_files(selector, file_path)
            logger.info(f"上传成功: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"上传失败: {e}")
            return False
    
    async def wait_for_selector(self, selector: str, timeout: Optional[int] = None) -> bool:
        """等待元素出现"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.wait_for_selector(selector, timeout=timeout)
            logger.info(f"等待成功: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"等待失败: {e}")
            return False
    
    async def wait_for_url(self, url_pattern: str, timeout: Optional[int] = None) -> bool:
        """等待URL匹配"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.wait_for_url(url_pattern, timeout=timeout)
            logger.info(f"URL匹配成功: {url_pattern}")
            return True
            
        except Exception as e:
            logger.error(f"URL匹配失败: {e}")
            return False
    
    async def screenshot(self, path: str) -> bool:
        """截图"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.screenshot(path=path)
            logger.info(f"截图成功: {path}")
            return True
            
        except Exception as e:
            logger.error(f"截图失败: {e}")
            return False
    
    async def get_cookies(self) -> List[Dict[str, Any]]:
        """获取cookies"""
        try:
            if not self.is_running or not self.context:
                raise Exception("浏览器未启动")
            
            cookies = await self.context.cookies()
            return cookies
            
        except Exception as e:
            logger.error(f"获取cookies失败: {e}")
            return []
    
    async def set_cookies(self, cookies: List[Dict[str, Any]]) -> bool:
        """设置cookies"""
        try:
            if not self.is_running or not self.context:
                raise Exception("浏览器未启动")
            
            await self.context.add_cookies(cookies)
            logger.info(f"设置cookies成功: {len(cookies)}个")
            return True
            
        except Exception as e:
            logger.error(f"设置cookies失败: {e}")
            return False
    
    async def evaluate(self, expression: str) -> Any:
        """执行JavaScript"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            result = await self.page.evaluate(expression)
            return result
            
        except Exception as e:
            logger.error(f"执行JS失败: {e}")
            return None
    
    async def query_selector_all(self, selector: str) -> List[Any]:
        """查询所有匹配元素"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            elements = await self.page.query_selector_all(selector)
            return elements
            
        except Exception as e:
            logger.error(f"查询元素失败: {e}")
            return []
    
    async def get_element_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """获取元素属性"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            element = await self.page.query_selector(selector)
            if element:
                return await element.get_attribute(attribute)
            return None
            
        except Exception as e:
            logger.error(f"获取属性失败: {e}")
            return None
    
    async def hover(self, selector: str) -> bool:
        """悬停元素"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            await self.page.hover(selector)
            logger.info(f"悬停成功: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"悬停失败: {e}")
            return False
    
    async def scroll_into_view(self, selector: str) -> bool:
        """滚动到元素可见"""
        try:
            if not self.is_running or not self.page:
                raise Exception("浏览器未启动")
            
            element = await self.page.query_selector(selector)
            if element:
                await element.scroll_into_view_if_needed()
                logger.info(f"滚动成功: {selector}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"滚动失败: {e}")
            return False
    
    async def save_storage_state(self, path: str) -> bool:
        """保存存储状态（cookies, localStorage等）"""
        try:
            if not self.is_running or not self.context:
                raise Exception("浏览器未启动")
            
            storage_state = await self.context.storage_state()
            
            with open(path, "w") as f:
                json.dump(storage_state, f)
            
            logger.info(f"保存存储状态成功: {path}")
            return True
            
        except Exception as e:
            logger.error(f"保存存储状态失败: {e}")
            return False
    
    async def load_storage_state(self, path: str) -> bool:
        """加载存储状态"""
        try:
            if not self.is_running or not self.context:
                raise Exception("浏览器未启动")
            
            with open(path, "r") as f:
                storage_state = json.load(f)
            
            await self.context.add_cookies(storage_state.get("cookies", []))
            logger.info(f"加载存储状态成功: {path}")
            return True
            
        except Exception as e:
            logger.error(f"加载存储状态失败: {e}")
            return False


class PlaywrightBotPool:
    """浏览器实例池"""
    
    def __init__(self, max_instances: int = 5):
        self.max_instances = max_instances
        self.instances: Dict[str, PlaywrightBot] = {}
        self.available_ids: List[str] = []
    
    async def acquire(self, instance_id: Optional[str] = None) -> PlaywrightBot:
        """获取浏览器实例"""
        # 如果指定了ID且实例存在
        if instance_id and instance_id in self.instances:
            return self.instances[instance_id]
        
        # 检查是否有可用实例
        if self.available_ids:
            available_id = self.available_ids.pop(0)
            return self.instances[available_id]
        
        # 检查是否达到最大实例数
        if len(self.instances) >= self.max_instances:
            raise Exception(f"已达最大实例数: {self.max_instances}")
        
        # 创建新实例
        new_id = instance_id or f"bot_{len(self.instances) + 1}"
        bot = PlaywrightBot()
        await bot.start()
        
        self.instances[new_id] = bot
        logger.info(f"创建浏览器实例: {new_id}")
        
        return bot
    
    async def release(self, instance_id: str):
        """释放浏览器实例"""
        if instance_id in self.instances:
            self.available_ids.append(instance_id)
            logger.info(f"释放浏览器实例: {instance_id}")
    
    async def destroy(self, instance_id: str):
        """销毁浏览器实例"""
        if instance_id in self.instances:
            bot = self.instances[instance_id]
            await bot.stop()
            
            del self.instances[instance_id]
            
            if instance_id in self.available_ids:
                self.available_ids.remove(instance_id)
            
            logger.info(f"销毁浏览器实例: {instance_id}")
    
    async def destroy_all(self):
        """销毁所有实例"""
        for instance_id in list(self.instances.keys()):
            await self.destroy(instance_id)
        
        logger.info("销毁所有浏览器实例")


# 全局浏览器实例池
bot_pool = PlaywrightBotPool()