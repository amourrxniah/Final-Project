import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ----- MOCK GEOAPIFY -----
@pytest.fixture
def mock_places(monkeypatch):
    def fake_places(lat, lon, limit):
        return [
            {
                "place_id": "1",
                "title": "City Cafe",
                "subtitle": "Nice cafe",
                "categories": ["cafe"],
                "category_names": ["cafe"],
                "latitude": lat,
                "longitude": lon,
                "distance": 0.5,
                "rating": 4.5,
                "price": 2,
                "poplarity": 0.8
            },
            {
                "place_id": "2",
                "title": "Night Club X",
                "subtitle": "Party",
                "categories": ["nightclub"],
                "category_names": ["nightclub"],
                "latitude": lat,
                "longitude": lon,
                "distance": 1.2,
                "rating": 4.0,
                "price": 3,
                "poplarity": 0.9
            },
            {
                "place_id": "3",
                "title": "Green Park",
                "subtitle": "Relax ",
                "categories": ["park"],
                "category_names": ["park"],
                "latitude": lat,
                "longitude": lon,
                "distance": 0.8,
                "rating": 4.8,
                "price": 1,
                "poplarity": 0.7
            },
        ]
    
    monkeypatch.setattr("app.services.geoapify.get_places", fake_places)