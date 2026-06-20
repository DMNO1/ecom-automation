from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_messages():
    response = client.get("/api/messages/")
    assert response.status_code == 200
    assert response.json() == {"message": "客服消息 - 待实现"}
