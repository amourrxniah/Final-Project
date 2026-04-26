import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def test_client():
    return client

@pytest.fixture
def auth_headers():
    """
    Simple fake auth header.
    Replace token if needed.
    """
    return {
        "Authorization": "Bearer testtoken"
    }