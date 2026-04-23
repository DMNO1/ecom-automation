from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_aftersales():
    response = client.get("/api/aftersales/")
    assert response.status_code == 200
    assert response.json() == {"message": "售后单列表 - 待实现"}
