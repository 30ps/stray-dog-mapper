import pytest
from fastapi.testclient import TestClient
from app.routes import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_get_dogs():
    response = client.get("/dogs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_dog_non_dog():
    # Simulate non-dog image
    valid_base64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wIAAgMBApU8AAAAAElFTkSuQmCC"
    payload = {
        "name": "Test",
        "image": valid_base64_image,
        "location": {"lat": 0, "lng": 0}
    }
    # Patch analyze_image to return is_dog=False
    from app import vision
    vision.analyze_image = lambda url: {"is_dog": False}
    response = client.post("/dogs", json=payload)
    assert response.status_code == 400
    assert "not a dog" in response.json()["detail"].lower()
