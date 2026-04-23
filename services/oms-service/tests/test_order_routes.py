from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from fastapi import FastAPI
import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from routes.order_routes import router
from models import Order, Platform, OrderStatus, PaymentStatus, RiskLevel

app = FastAPI()
app.include_router(router)

client = TestClient(app)

def create_mock_order():
    return {
        "order_id": "ORD-123",
        "platform": "douyin",
        "platform_order_id": "DY-123",
        "status": "pending",
        "payment_status": "unpaid",
        "items": [
            {
                "sku_id": "SKU-001",
                "product_name": "Test Product",
                "quantity": 1,
                "unit_price": 100.0,
                "total_price": 100.0
            }
        ],
        "total_amount": 100.0,
        "discount_amount": 0,
        "actual_amount": 100.0,
        "customer": {
            "customer_id": "CUST-001",
            "name": "Test User",
            "phone": "13800138000",
            "address": "Test Address",
            "platform_uid": "DY-USER-001"
        },
        "created_at": "2023-01-01T12:00:00",
        "updated_at": "2023-01-01T12:00:00",
        "tags": [],
        "risk_level": "low"
    }

@patch("routes.order_routes.order_manager")
def test_create_order_success(mock_order_manager):
    mock_order_data = create_mock_order()
    mock_order_manager.create_order.return_value = Order(**mock_order_data)

    response = client.post("/", json=mock_order_data)

    assert response.status_code == 200
    mock_order_manager.create_order.assert_called_once()

@patch("routes.order_routes.order_manager")
def test_create_order_exception(mock_order_manager):
    # Setup mock to raise exception
    mock_order_manager.create_order.side_effect = Exception("Test Error")

    mock_order_data = create_mock_order()

    # Test failed order creation
    response = client.post("/", json=mock_order_data)

    assert response.status_code == 400
    assert response.json() == {"detail": "创建订单失败: Test Error"}
