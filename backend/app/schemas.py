from pydantic import BaseModel
from typing import Optional, Dict, Any

class Location(BaseModel):
    latitude: float
    longitude: float

class DogBase(BaseModel):
    breed: Optional[str] = None
    age: Optional[str] = None
    size: Optional[str] = None
    color_markings: Optional[str] = None
    coat_type: Optional[str] = None
    ear_shape: Optional[str] = None
    tail_type: Optional[str] = None
    build: Optional[str] = None
    facial_features: Optional[str] = None
    other: Optional[str] = None
    location: Optional[Location] = None
    blob_path: Optional[str] = None  # GCS object path
    attributes: Optional[Dict[str, Any]] = None  # For extra/derived attributes

class DogCreate(DogBase):
    image: str  # base64-encoded image data

class DogOut(DogBase):
    id: Optional[str] = None
    image_url: Optional[str] = None
