import pytest
from fastapi.testclient import TestClient
from main import app
from routes.shops import shops_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db():
    """Clear the mock db before and after each test."""
    shops_db.clear()
    yield
    shops_db.clear()

def test_list_shops_empty():
    response = client.get("/api/shops/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_shop():
    response = client.post(
        "/api/shops/",
        json={"platform": "douyin", "shop_name": "Test Shop"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "douyin"
    assert data["shop_name"] == "Test Shop"
    assert data["auth_status"] == "pending"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_list_shops_not_empty():
    client.post("/api/shops/", json={"platform": "douyin", "shop_name": "Test Shop 1"})
    client.post("/api/shops/", json={"platform": "kuaishou", "shop_name": "Test Shop 2"})

    response = client.get("/api/shops/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_list_shops_by_platform():
    client.post("/api/shops/", json={"platform": "douyin", "shop_name": "Test Shop 1"})
    client.post("/api/shops/", json={"platform": "kuaishou", "shop_name": "Test Shop 2"})

    response = client.get("/api/shops/?platform=douyin")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["platform"] == "douyin"

def test_get_shop():
    res = client.post("/api/shops/", json={"platform": "douyin", "shop_name": "Test Shop"})
    shop_id = res.json()["id"]

    response = client.get(f"/api/shops/{shop_id}")
    assert response.status_code == 200
    assert response.json()["id"] == shop_id

def test_get_shop_not_found():
    response = client.get("/api/shops/nonexistent_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "店铺不存在"

def test_delete_shop():
    res = client.post("/api/shops/", json={"platform": "douyin", "shop_name": "Test Shop"})
    shop_id = res.json()["id"]

    response = client.delete(f"/api/shops/{shop_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "删除成功"}

    # Verify it's deleted
    response = client.get(f"/api/shops/{shop_id}")
    assert response.status_code == 404
