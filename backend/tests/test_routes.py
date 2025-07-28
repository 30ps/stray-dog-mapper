from dotenv import load_dotenv
load_dotenv()
import pytest
from fastapi.testclient import TestClient
from app.routes import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_get_dogs_sightings():
    response = client.get("/dogs_sightings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_dog_sighting_non_dog():
    # Simulate non-dog image
    valid_base64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wIAAgMBApU8AAAAAElFTkSuQmCC"
    payload = {
        "name": "Test",
        "image": valid_base64_image,
        "location": {"latitude": 0, "longitude": 0}
    }
    # Patch analyze_image to return is_dog=False
    from app import vision
    vision.analyze_image = lambda url: {"is_dog": False}
    response = client.post("/dogs_sightings", json=payload)
    assert response.status_code == 400
    assert "not a dog" in response.json()["detail"].lower()

def test_create_dog_sighting_integration():
    import base64
    import os
    import requests

    # Download a sample dog image from the internet (if not already present)
    img_path = "tests/test_images/sample_dog.jpg"
    os.makedirs(os.path.dirname(img_path), exist_ok=True)
    if not os.path.exists(img_path):
        url = "https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg"
        r = requests.get(url)
        with open(img_path, "wb") as f:
            f.write(r.content)

    # Read and encode the image as base64
    with open(img_path, "rb") as img_file:
        encoded_string = base64.b64encode(img_file.read()).decode("utf-8")

    payload = {
        "image": encoded_string,
        "location": {"latitude": 39.3626, "longitude": 22.9465}
    }

    # This will use the real upload_image, analyze_image, and add_dog_sighting functions
    response = client.post("/dogs_sightings", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert "id" in data and data["id"] is not None
    assert "image_url" in data
    assert data["location"]["latitude"] == 39.3626
    assert data["location"]["longitude"] == 22.9465
    # Optionally check breed, age, size if your Vision API is configured
    assert "breed" in data or "attributes" in data
    assert "age" in data or "attributes" in data
    assert "size" in data or "attributes" in data
