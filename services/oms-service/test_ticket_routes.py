import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import patch

from routes.ticket_routes import router

app = FastAPI()
app.include_router(router)

client = TestClient(app)

def test_create_ticket_error():
    # Mock the ticket_manager.create_ticket method to raise an exception
    with patch('routes.ticket_routes.ticket_manager.create_ticket') as mock_create_ticket:
        mock_create_ticket.side_effect = Exception("Simulated creation error")

        response = client.post("/", json={"title": "Test Ticket", "description": "Test"})

        assert response.status_code == 400
        assert response.json()["detail"] == "创建工单失败: Simulated creation error"
        mock_create_ticket.assert_called_once()
