
from google.cloud import storage
import uuid
import base64
import os

GCS_BUCKET = os.getenv("GCS_BUCKET", "dogs-images")

def upload_image(image_data: str) -> str:
    """
    Uploads base64-encoded image data to GCS and returns the public URL.
    """
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    image_bytes = base64.b64decode(image_data)
    image_id = str(uuid.uuid4())
    blob = bucket.blob(f"dogs/{image_id}.jpg")
    blob.upload_from_string(image_bytes, content_type="image/jpeg")
    # blob.make_public()
    return f"https://storage.googleapis.com/{GCS_BUCKET}/{blob.name}"
