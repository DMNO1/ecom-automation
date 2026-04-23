import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

def test_list_messages():
    response = client.get("/api/messages/")
    assert response.status_code == 200
    assert response.json() == {"message": "客服消息 - 待实现"}
