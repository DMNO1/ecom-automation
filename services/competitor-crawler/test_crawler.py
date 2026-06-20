import unittest
from unittest.mock import patch, MagicMock, AsyncMock
from crawler import BaseCrawler, DouyinCrawler, KuaishouCrawler, PddCrawler, XianyuCrawler, CrawlerFactory, Platform, CrawlerEngine

# Dummy concrete crawler for testing BaseCrawler
class DummyCrawler(BaseCrawler):
    async def crawl_product(self, url: str):
        pass

class TestCrawler(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.dummy_crawler = DummyCrawler()
        self.douyin_crawler = DouyinCrawler()
        self.crawler_engine = CrawlerEngine()

    async def test_crawler_engine_init(self):
        """Test CrawlerEngine initialization."""
        self.assertEqual(self.crawler_engine._browsers, {})

    async def test_crawler_engine_initialize(self):
        """Test CrawlerEngine.initialize runs without errors."""
        try:
            await self.crawler_engine.initialize()
        except Exception as e:
            self.fail(f"CrawlerEngine.initialize raised an exception {e}")

    async def test_extract_price(self):
        """Test BaseCrawler.extract_price extracts prices correctly from various formats."""
        test_cases = [
            ("¥199.99", 199.99),
            ("￥ 199.99", 199.99),
            ("199.99元", 199.99),
            ("价格: 199.99", 199.99),
            ("价格： 199.99", 199.99),
            ("199.99", 199.99),
            ("99", 99.0),
            ("No price here", None),
        ]

        for text, expected in test_cases:
            with self.subTest(text=text):
                result = await self.dummy_crawler.extract_price(text)
                self.assertEqual(result, expected)

    def test_extract_product_id_douyin(self):
        """Test DouyinCrawler._extract_product_id extracts product IDs correctly."""
        test_cases = [
            ("https://www.douyin.com/product/123456?product_id=78910", "78910"),
            ("https://www.douyin.com/product/123456", "5b7cb750b17379a5"), # MD5 of the URL, first 16 chars
        ]

        for url, expected in test_cases:
            with self.subTest(url=url):
                result = self.douyin_crawler._extract_product_id(url)
                self.assertEqual(result, expected)

    def test_extract_sales_count_douyin(self):
        """Test DouyinCrawler._extract_sales_count extracts sales counts correctly."""
        test_cases = [
            ("已售 1.2万", 12000),
            ("已售 12000", 12000),
            ("已售 1.2万+", 12000),
            ("已售 500+", 500),
            ("1,234", 1234),
            ("invalid format", None),
            (None, None),
        ]

        for text, expected in test_cases:
            with self.subTest(text=text):
                result = self.douyin_crawler._extract_sales_count(text)
                self.assertEqual(result, expected)

    def test_crawler_factory(self):
        """Test CrawlerFactory.create_crawler creates correct instances."""
        self.assertIsInstance(CrawlerFactory.create_crawler(Platform.DOUYIN), DouyinCrawler)
        self.assertIsInstance(CrawlerFactory.create_crawler(Platform.KUAISHOU), KuaishouCrawler)
        self.assertIsInstance(CrawlerFactory.create_crawler(Platform.PDD), PddCrawler)
        self.assertIsInstance(CrawlerFactory.create_crawler(Platform.XIANYU), XianyuCrawler)

        with self.assertRaises(ValueError):
            CrawlerFactory.create_crawler("invalid_platform")

if __name__ == '__main__':
    unittest.main()
