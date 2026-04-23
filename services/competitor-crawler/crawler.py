"""
核心爬虫模块
支持抖音/快手/拼多多/闲鱼
"""
import asyncio
import hashlib
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse, parse_qs

import httpx
from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
from PIL import Image
import imagehash
from loguru import logger
from fake_useragent import UserAgent
from retry import retry

from storage import Platform, ProductSnapshot


class CrawlerEngine:
    def __init__(self):
        self._browsers = {}

    async def initialize(self):
        # 待实现浏览器初始化
        pass


@dataclass
class CrawlResult:
    """爬取结果"""
    success: bool
    data: Optional[ProductSnapshot] = None
    error: Optional[str] = None
    retry_count: int = 0


class BaseCrawler(ABC):
    """爬虫基类"""
    
    def __init__(self):
        self.ua = UserAgent()
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        
    async def __aenter__(self):
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()
    
    async def start(self):
        """初始化浏览器和HTTP客户端"""
        try:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled'
                ]
            )
            
            context = await self.browser.new_context(
                user_agent=self.ua.random,
                viewport={'width': 1920, 'height': 1080},
                locale='zh-CN',
                timezone_id='Asia/Shanghai'
            )
            
            # 添加反检测脚本
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'en']});
            """)
            
            self.page = await context.new_page()
            
            # HTTP客户端
            self.http_client = httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=True,
                headers={'User-Agent': self.ua.random}
            )
            
            logger.info(f"{self.__class__.__name__} initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize crawler: {e}")
            raise
    
    async def stop(self):
        """关闭浏览器和HTTP客户端"""
        try:
            if self.page:
                await self.page.close()
            if self.browser:
                await self.browser.close()
            if self.http_client:
                await self.http_client.aclose()
            logger.info(f"{self.__class__.__name__} stopped")
        except Exception as e:
            logger.error(f"Error stopping crawler: {e}")
    
    async def take_screenshot(self, url: str) -> Optional[str]:
        """截图并计算哈希"""
        try:
            await self.page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(1, 3))
            
            # 查找主图
            selectors = [
                'img.main-img', 'img.product-img', '.product-image img',
                'img[data-role="product-image"]', '.swiper-slide img',
                'img[src*="product"]', 'img[src*="goods"]'
            ]
            
            img_element = None
            for selector in selectors:
                try:
                    img_element = await self.page.query_selector(selector)
                    if img_element:
                        break
                except:
                    continue
            
            if not img_element:
                # 截取整个页面
                screenshot = await self.page.screenshot()
            else:
                screenshot = await img_element.screenshot()
            
            # 计算感知哈希
            from io import BytesIO
            img = Image.open(BytesIO(screenshot))
            img_hash = imagehash.phash(img)
            
            return str(img_hash)
            
        except Exception as e:
            logger.error(f"Failed to take screenshot: {e}")
            return None
    
    async def extract_price(self, text: str) -> Optional[float]:
        """从文本中提取价格"""
        import re
        # 匹配价格格式：¥199.99, 199.99, ￥199, 199元等
        patterns = [
            r'¥\s*(\d+\.?\d*)',
            r'￥\s*(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*元',
            r'价格[：:]\s*(\d+\.?\d*)',
            r'(\d+\.?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return None
    
    async def extract_promotion_tags(self, page: Page) -> List[str]:
        """提取促销标签"""
        tags = []
        tag_selectors = [
            '.promotion-tag', '.coupon-tag', '.discount-tag',
            '.activity-tag', '.benefit-tag', '.label-list span',
            '[class*="promotion"]', '[class*="coupon"]', '[class*="discount"]'
        ]
        
        for selector in tag_selectors:
            try:
                elements = await page.query_selector_all(selector)
                for element in elements:
                    text = await element.text_content()
                    if text and text.strip():
                        tags.append(text.strip())
            except:
                continue
        
        return list(set(tags))
    
    @abstractmethod
    async def crawl_product(self, url: str) -> CrawlResult:
        """爬取商品详情（子类实现）"""
        pass


class DouyinCrawler(BaseCrawler):
    """抖音爬虫"""
    
    async def crawl_product(self, url: str) -> CrawlResult:
        """爬取抖音商品"""
        try:
            await self.page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            
            # 等待页面加载
            await self.page.wait_for_selector('.product-info', timeout=10000)
            
            # 提取商品ID
            product_id = self._extract_product_id(url)
            
            # 提取标题
            title_elem = await self.page.query_selector('.product-title, h1, .goods-title')
            title = await title_elem.text_content() if title_elem else ""
            
            # 提取价格
            price_elem = await self.page.query_selector('.price, .product-price, .current-price')
            price_text = await price_elem.text_content() if price_elem else "0"
            price = await self.extract_price(price_text)
            
            # 提取原价
            original_price_elem = await self.page.query_selector('.original-price, .line-price')
            original_price = None
            if original_price_elem:
                original_price_text = await original_price_elem.text_content()
                original_price = await self.extract_price(original_price_text)
            
            # 截图并计算哈希
            image_hash = await self.take_screenshot(url)
            
            # 提取促销标签
            promotion_tags = await self.extract_promotion_tags(self.page)
            
            # 提取评论关键词（如果页面有评论）
            comment_keywords = await self._extract_comments()
            
            # 提取销量
            sales_elem = await self.page.query_selector('.sales-count, .sold-count')
            sales_count = None
            if sales_elem:
                sales_text = await sales_elem.text_content()
                sales_count = self._extract_sales_count(sales_text)
            
            # 提取店铺名
            shop_elem = await self.page.query_selector('.shop-name, .store-name')
            shop_name = await shop_elem.text_content() if shop_elem else None
            
            snapshot = ProductSnapshot(
                platform=Platform.DOUYIN,
                product_id=product_id,
                url=url,
                title=title.strip(),
                price=price or 0.0,
                original_price=original_price,
                main_image_hash=image_hash or "",
                promotion_tags=promotion_tags,
                comment_keywords=comment_keywords,
                sales_count=sales_count,
                shop_name=shop_name.strip() if shop_name else None,
                raw_data={"url": url}
            )
            
            return CrawlResult(success=True, data=snapshot)
            
        except Exception as e:
            logger.error(f"Failed to crawl Douyin product: {e}")
            return CrawlResult(success=False, error=str(e))
    
    def _extract_product_id(self, url: str) -> str:
        """从URL提取商品ID"""
        parsed = urlparse(url)
        if 'product_id' in parsed.query:
            params = parse_qs(parsed.query)
            return params['product_id'][0]
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    async def _extract_comments(self) -> List[str]:
        """提取评论关键词"""
        comments = []
        try:
            comment_selectors = [
                '.comment-content', '.comment-text', '.review-content',
                '[class*="comment"] p', '[class*="review"] p'
            ]
            
            for selector in comment_selectors:
                elements = await self.page.query_selector_all(selector)
                for element in elements[:10]:  # 限制评论数量
                    text = await element.text_content()
                    if text and len(text.strip()) > 5:
                        comments.append(text.strip())
        except:
            pass
        return comments
    
    def _extract_sales_count(self, text: str) -> Optional[int]:
        """提取销量数字"""
        import re
        if not text:
            return None
        
        # 处理 "已售 1.2万" 格式
        text = text.replace(',', '')
        match = re.search(r'(\d+\.?\d*)\s*万', text)
        if match:
            return int(float(match.group(1)) * 10000)
        
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
        
        return None


class KuaishouCrawler(BaseCrawler):
    """快手爬虫"""
    
    async def crawl_product(self, url: str) -> CrawlResult:
        """爬取快手商品"""
        try:
            await self.page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            
            # 等待页面加载
            await self.page.wait_for_selector('.goods-detail', timeout=10000)
            
            # 提取商品ID
            product_id = self._extract_product_id(url)
            
            # 提取标题
            title_elem = await self.page.query_selector('.goods-title, h1')
            title = await title_elem.text_content() if title_elem else ""
            
            # 提取价格
            price_elem = await self.page.query_selector('.price, .goods-price')
            price_text = await price_elem.text_content() if price_elem else "0"
            price = await self.extract_price(price_text)
            
            # 截图并计算哈希
            image_hash = await self.take_screenshot(url)
            
            # 提取促销标签
            promotion_tags = await self.extract_promotion_tags(self.page)
            
            # 提取评论关键词
            comment_keywords = await self._extract_comments()
            
            snapshot = ProductSnapshot(
                platform=Platform.KUAISHOU,
                product_id=product_id,
                url=url,
                title=title.strip(),
                price=price or 0.0,
                main_image_hash=image_hash or "",
                promotion_tags=promotion_tags,
                comment_keywords=comment_keywords,
                raw_data={"url": url}
            )
            
            return CrawlResult(success=True, data=snapshot)
            
        except Exception as e:
            logger.error(f"Failed to crawl Kuaishou product: {e}")
        return CrawlResult(success=False, error=str(e))
    
    def _extract_product_id(self, url: str) -> str:
        """从URL提取商品ID"""
        parsed = urlparse(url)
        if 'goods_id' in parsed.query:
            params = parse_qs(parsed.query)
            return params['goods_id'][0]
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    async def _extract_comments(self) -> List[str]:
        """提取评论关键词"""
        comments = []
        try:
            comment_selectors = ['.comment-text', '.review-content']
            for selector in comment_selectors:
                elements = await self.page.query_selector_all(selector)
                for element in elements[:10]:
                    text = await element.text_content()
                    if text and len(text.strip()) > 5:
                        comments.append(text.strip())
        except:
            pass
        return comments


class PddCrawler(BaseCrawler):
    """拼多多爬虫"""
    
    async def crawl_product(self, url: str) -> CrawlResult:
        """爬取拼多多商品"""
        try:
            await self.page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            
            # 等待页面加载
            await self.page.wait_for_selector('.goods-detail-page', timeout=10000)
            
            # 提取商品ID
            product_id = self._extract_product_id(url)
            
            # 提取标题
            title_elem = await self.page.query_selector('.goods-detail-page h1, .goods-title')
            title = await title_elem.text_content() if title_elem else ""
            
            # 提取价格
            price_elem = await self.page.query_selector('.goods-price, .price')
            price_text = await price_elem.text_content() if price_elem else "0"
            price = await self.extract_price(price_text)
            
            # 提取原价
            original_price_elem = await self.page.query_selector('.original-price')
            original_price = None
            if original_price_elem:
                original_price_text = await original_price_elem.text_content()
                original_price = await self.extract_price(original_price_text)
            
            # 截图并计算哈希
            image_hash = await self.take_screenshot(url)
            
            # 提取促销标签
            promotion_tags = await self.extract_promotion_tags(self.page)
            
            # 提取评论关键词
            comment_keywords = await self._extract_comments()
            
            # 提取销量
            sales_elem = await self.page.query_selector('.sold-count, .sales-count')
            sales_count = None
            if sales_elem:
                sales_text = await sales_elem.text_content()
                sales_count = self._extract_sales_count(sales_text)
            
            snapshot = ProductSnapshot(
                platform=Platform.PDD,
                product_id=product_id,
                url=url,
                title=title.strip(),
                price=price or 0.0,
                original_price=original_price,
                main_image_hash=image_hash or "",
                promotion_tags=promotion_tags,
                comment_keywords=comment_keywords,
                sales_count=sales_count,
                raw_data={"url": url}
            )
            
            return CrawlResult(success=True, data=snapshot)
            
        except Exception as e:
            logger.error(f"Failed to crawl PDD product: {e}")
            return CrawlResult(success=False, error=str(e))
    
    def _extract_product_id(self, url: str) -> str:
        """从URL提取商品ID"""
        parsed = urlparse(url)
        if 'goods_id' in parsed.query:
            params = parse_qs(parsed.query)
            return params['goods_id'][0]
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    async def _extract_comments(self) -> List[str]:
        """提取评论关键词"""
        comments = []
        try:
            comment_selectors = ['.comment-text', '.review-content', '.comment-content']
            for selector in comment_selectors:
                elements = await self.page.query_selector_all(selector)
                for element in elements[:10]:
                    text = await element.text_content()
                    if text and len(text.strip()) > 5:
                        comments.append(text.strip())
        except:
            pass
        return comments
    
    def _extract_sales_count(self, text: str) -> Optional[int]:
        """提取销量数字"""
        import re
        if not text:
            return None
        
        text = text.replace(',', '')
        match = re.search(r'(\d+\.?\d*)\s*万', text)
        if match:
            return int(float(match.group(1)) * 10000)
        
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
        
        return None


class XianyuCrawler(BaseCrawler):
    """闲鱼爬虫"""
    
    async def crawl_product(self, url: str) -> CrawlResult:
        """爬取闲鱼商品"""
        try:
            await self.page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            
            # 等待页面加载
            await self.page.wait_for_selector('.item-detail', timeout=10000)
            
            # 提取商品ID
            product_id = self._extract_product_id(url)
            
            # 提取标题
            title_elem = await self.page.query_selector('.item-title, h1')
            title = await title_elem.text_content() if title_elem else ""
            
            # 提取价格
            price_elem = await self.page.query_selector('.item-price, .price')
            price_text = await price_elem.text_content() if price_elem else "0"
            price = await self.extract_price(price_text)
            
            # 截图并计算哈希
            image_hash = await self.take_screenshot(url)
            
            # 提取促销标签（闲鱼一般没有）
            promotion_tags = await self.extract_promotion_tags(self.page)
            
            # 提取评论关键词
            comment_keywords = await self._extract_comments()
            
            # 提取卖家信息
            seller_elem = await self.page.query_selector('.seller-name, .user-name')
            shop_name = await seller_elem.text_content() if seller_elem else None
            
            snapshot = ProductSnapshot(
                platform=Platform.XIANYU,
                product_id=product_id,
                url=url,
                title=title.strip(),
                price=price or 0.0,
                main_image_hash=image_hash or "",
                promotion_tags=promotion_tags,
                comment_keywords=comment_keywords,
                shop_name=shop_name.strip() if shop_name else None,
                raw_data={"url": url}
            )
            
            return CrawlResult(success=True, data=snapshot)
            
        except Exception as e:
            logger.error(f"Failed to crawl Xianyu product: {e}")
            return CrawlResult(success=False, error=str(e))
    
    def _extract_product_id(self, url: str) -> str:
        """从URL提取商品ID"""
        parsed = urlparse(url)
        if 'id' in parsed.query:
            params = parse_qs(parsed.query)
            return params['id'][0]
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    async def _extract_comments(self) -> List[str]:
        """提取评论关键词"""
        comments = []
        try:
            comment_selectors = ['.comment-text', '.review-content']
            for selector in comment_selectors:
                elements = await self.page.query_selector_all(selector)
                for element in elements[:10]:
                    text = await element.text_content()
                    if text and len(text.strip()) > 5:
                        comments.append(text.strip())
        except:
            pass
        return comments


class CrawlerFactory:
    """爬虫工厂"""
    
    @staticmethod
    def create_crawler(platform: Platform) -> BaseCrawler:
        """创建对应平台的爬虫"""
        crawlers = {
            Platform.DOUYIN: DouyinCrawler,
            Platform.KUAISHOU: KuaishouCrawler,
            Platform.PDD: PddCrawler,
            Platform.XIANYU: XianyuCrawler
        }
        
        crawler_class = crawlers.get(platform)
        if not crawler_class:
            raise ValueError(f"Unsupported platform: {platform}")
        
        return crawler_class()


# 便捷函数
async def crawl_product(platform: Platform, url: str) -> CrawlResult:
    """爬取单个商品"""
    async with CrawlerFactory.create_crawler(platform) as crawler:
        return await crawler.crawl_product(url)


async def batch_crawl(urls: List[Dict[str, str]]) -> List[CrawlResult]:
    """批量爬取商品"""
    results = []
    for item in urls:
        platform = Platform(item['platform'])
        url = item['url']
        try:
            result = await crawl_product(platform, url)
            results.append(result)
            # 随机延迟，避免被封
            await asyncio.sleep(random.uniform(1, 3))
        except Exception as e:
            logger.error(f"Failed to crawl {url}: {e}")
            results.append(CrawlResult(success=False, error=str(e)))
    
    return results
