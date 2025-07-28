
from google.cloud import storage
import uuid
import base64
import os
from datetime import timedelta

GCS_BUCKET = os.getenv("GCS_BUCKET", "dogs-images")

def upload_image(image_data: str) -> str:
    """
    Uploads base64-encoded image data to GCS and returns the public URL.
    """
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    image_bytes = base64.b64decode(image_data)
    image_id = str(uuid.uuid4())
    blob_path = f"dogs_sightings/{image_id}.jpg"
    blob = bucket.blob(blob_path)
    blob.upload_from_string(image_bytes, content_type="image/jpeg")
    return blob_path  # Store this in Firestore

def get_signed_url(blob_path: str) -> str:
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(blob_path)
    return blob.generate_signed_url(expiration=timedelta(minutes=10), method="GET")
