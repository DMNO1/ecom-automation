import pytest
from fastapi.testclient import TestClient
import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_create_inventory_item_success():
    """测试创建库存项目成功路径"""
    with patch('routes.inventory_routes.inventory_manager.create_inventory_item') as mock_create:
        mock_create.return_value = {
            "sku_id": "test_sku_123",
            "product_name": "Test Product",
            "platform": "douyin",
            "total_stock": 0,
            "available_stock": 0,
            "locked_stock": 0,
            "in_transit_stock": 0,
            "min_stock_alert": 10,
            "max_stock_alert": 1000,
            "risk_tags": [],
            "risk_level": "low",
            "last_updated": "2023-01-01T00:00:00Z",
            "created_at": "2023-01-01T00:00:00Z"
        }
        item_data = {
            "sku_id": "test_sku_123",
            "product_name": "Test Product",
            "platform": "douyin"
        }
        response = client.post("/api/inventory/", json=item_data)
        assert response.status_code == 200
        assert response.json()["sku_id"] == "test_sku_123"

def test_create_inventory_item_error():
    """测试创建库存项目错误路径"""
    with patch('routes.inventory_routes.inventory_manager.create_inventory_item') as mock_create:
        mock_create.side_effect = Exception("Simulated DB connection error")
        item_data = {
            "sku_id": "test_sku_error",
            "product_name": "Test Product",
            "platform": "douyin"
        }
        response = client.post("/api/inventory/", json=item_data)

        assert response.status_code == 400
        assert "创建库存项目失败" in response.json()["detail"]
        assert "Simulated DB connection error" in response.json()["detail"]
