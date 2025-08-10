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


def test_create_dog_sighting_with_file_upload(monkeypatch):
    import os
    import json
    img_path = "tests/test_images/sample_dog.jpg"
    # Ensure the sample image exists
    if not os.path.exists(img_path):
        import requests
        url = "https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg"
        r = requests.get(url)
        with open(img_path, "wb") as f:
            f.write(r.content)

    # Patch analyze_image to always return is_dog True and some attributes
    monkeypatch.setattr("app.vision.analyze_image", lambda blob_path: {"is_dog": True, "breed": "Hound", "age": 3, "size": "Medium"})
    # Patch upload_image to simulate reading the file content and return a fake blob path
    def mock_upload_image(file):
        return "fake/blob/path.jpg"
    monkeypatch.setattr("app.storage.upload_image", mock_upload_image)
    # Patch add_dog_sighting to return a mock object with expected attributes
    class MockSighting:
        def __init__(self):
            self.id = "testid"
            self.location = {"latitude": 39.3626, "longitude": 22.9465}
            self.timestamp = "2025-07-29T12:00:00Z"
            self.blob_path = "fake/blob/path.jpg"
            self.image_url = None
            self.breed = "Hound"
            self.age = 3
            self.size = "Medium"
        @property
        def attributes(self):
            return {"breed": "Hound", "age": 3, "size": "Medium"}
    monkeypatch.setattr("app.routes.add_dog_sighting", lambda dog_data, attributes, blob_path, timestamp=None: MockSighting())
    # Patch get_signed_url to return a fake URL
    monkeypatch.setattr("app.storage.get_signed_url", lambda blob_path: f"https://fakeurl.com/{blob_path}")

    with open(img_path, "rb") as img_file:
        files = {"file1": ("sample_dog.jpg", img_file, "image/jpeg")}
        data = {
            "location": json.dumps({"latitude": 39.3626, "longitude": 22.9465}),
            "timestamp": "2025-07-29T12:00:00Z"
        }
        response = client.post("/dogs_sightings", files=files, data=data)
    assert response.status_code == 200, response.text
    resp_json = response.json()
    assert resp_json["id"] == "testid"
    assert resp_json["location"]["latitude"] == 39.3626
    assert resp_json["location"]["longitude"] == 22.9465
    assert resp_json["image_url"] == "https://fakeurl.com/fake/blob/path.jpg"
    assert resp_json["attributes"]["breed"] == "Hound"
    assert resp_json["attributes"]["age"] == 3
    assert resp_json["attributes"]["size"] == "Medium"
