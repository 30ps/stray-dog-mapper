from pydantic import BaseModel
from typing import Optional, Dict, Any

class Location(BaseModel):
    latitude: float
    longitude: float


class DogSightingBase(BaseModel):
    name: Optional[str] = None
    location: Optional[Location] = None
    blob_path: Optional[str] = None  # GCS object path
    attributes: Optional[Dict[str, Any]] = None  # For extra/derived attributes
    timestamp: Optional[str] = None  # ISO8601 timestamp


class DogSightingCreate(DogSightingBase):
    image: str  # base64-encoded image data


class DogSightingOut(DogSightingBase):
    id: Optional[str] = None
    image_url: Optional[str] = None
