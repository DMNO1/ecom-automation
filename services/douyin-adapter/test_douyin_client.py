import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone
import httpx
from typing import Dict, Any

from douyin_client import DouyinClient, get_douyin_client, init_douyin_client
from auth import DouyinAuthManager
from models import DouyinConfig, ProductInfo, OrderInfo, InventoryUpdate, LogisticsInfo


class TestDouyinClient(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.config = DouyinConfig(
            app_key="test_app_key",
            app_secret="test_app_secret",
            access_token="test_token"
        )
        self.auth_manager = DouyinAuthManager(self.config)
        self.now_str = datetime.now(timezone.utc).isoformat()

    def test_init(self):
        client = DouyinClient(self.auth_manager)
        self.assertEqual(client.config, self.config)
        self.assertIsInstance(client.client, httpx.AsyncClient)

    def test_generate_sign(self):
        client = DouyinClient(self.auth_manager)
        params = {"b": "2", "a": "1"}
        # should sort to a1b2 + test_app_secret
        import hashlib
        expected_str = "a1b2test_app_secret"
        expected_sign = hashlib.md5(expected_str.encode('utf-8')).hexdigest()
        sign = client._generate_sign(params)
        self.assertEqual(sign, expected_sign)

    def test_add_common_params(self):
        client = DouyinClient(self.auth_manager)
        params = {"method": "test.method"}
        result = client._add_common_params(params)
        self.assertIn("app_key", result)
        self.assertIn("timestamp", result)
        self.assertIn("v", result)
        self.assertIn("sign", result)
        self.assertEqual(result["app_key"], "test_app_key")

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_request_success(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {"code": 0, "data": {"test": "success"}}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = await client._request("GET", "/test/api")
        self.assertEqual(result, {"code": 0, "data": {"test": "success"}})

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_request_api_error(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {"code": 10000, "message": "API Error"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await client._request("GET", "/test/api")

        self.assertTrue("API请求失败: API Error" in str(context.exception))

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_get_product_list(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 0,
            "data": {
                "list": [{"product_id": "123", "title": "Test Product", "price": 1000}],
                "total": 1,
                "has_more": False
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = await client.get_product_list(page=1, page_size=10, status=1, search_word="Test")
        self.assertEqual(result.total, 1)
        self.assertEqual(len(result.items), 1)
        self.assertEqual(result.items[0].product_id, "123")
        self.assertEqual(result.items[0].title, "Test Product")

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_get_product_detail(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 0,
            "data": {"product_id": "123", "title": "Detailed Product", "price": 2000}
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = await client.get_product_detail("123")
        self.assertIsInstance(result, ProductInfo)
        self.assertEqual(result.product_id, "123")
        self.assertEqual(result.title, "Detailed Product")

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_get_order_list(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 0,
            "data": {
                "list": [{"order_id": "o123", "order_status": 2, "pay_amount": 5000, "create_time": self.now_str}],
                "total": 1,
                "has_more": False
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = await client.get_order_list(page=1, page_size=10)
        self.assertEqual(result.total, 1)
        self.assertEqual(len(result.items), 1)
        self.assertEqual(result.items[0].order_id, "o123")

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_get_order_detail(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 0,
            "data": {"order_id": "o123", "order_status": 2, "pay_amount": 5000, "create_time": self.now_str}
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = await client.get_order_detail("o123")
        self.assertIsInstance(result, OrderInfo)
        self.assertEqual(result.order_id, "o123")

    @patch('douyin_client.httpx.AsyncClient.post', new_callable=AsyncMock)
    async def test_update_stock(self, mock_post):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {"code": 0, "data": {"success": True}}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        update = InventoryUpdate(product_id="123", quantity=10, update_type=1)
        result = await client.update_stock(update)
        self.assertEqual(result, {"success": True})

    @patch('douyin_client.httpx.AsyncClient.get', new_callable=AsyncMock)
    async def test_get_aftersale_list(self, mock_get):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 0,
            "data": {
                "list": [{"aftersale_id": "a123", "order_id": "o123", "status": 1, "apply_time": self.now_str}],
                "total": 1,
                "has_more": False
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = await client.get_aftersale_list(page=1, page_size=10)
        self.assertEqual(result.total, 1)
        self.assertEqual(len(result.items), 1)
        self.assertEqual(result.items[0].aftersale_id, "a123")

    @patch('douyin_client.httpx.AsyncClient.post', new_callable=AsyncMock)
    async def test_send_logistics(self, mock_post):
        client = DouyinClient(self.auth_manager)

        mock_response = MagicMock()
        mock_response.json.return_value = {"code": 0, "data": {"success": True}}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        logistics = LogisticsInfo(order_id="o123", company_code="shunfeng", tracking_number="SF123456")
        result = await client.send_logistics(logistics)
        self.assertEqual(result, {"success": True})

    async def test_close(self):
        client = DouyinClient(self.auth_manager)
        client.client.aclose = AsyncMock()
        await client.close()
        client.client.aclose.assert_called_once()

    def test_global_instances(self):
        with patch('auth.get_auth_manager') as mock_get_auth:
            mock_get_auth.return_value = self.auth_manager

            client1 = get_douyin_client()
            self.assertIsInstance(client1, DouyinClient)

            client2 = init_douyin_client(self.auth_manager)
            self.assertIsInstance(client2, DouyinClient)

if __name__ == '__main__':
    unittest.main()
