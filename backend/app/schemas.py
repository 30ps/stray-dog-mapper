from pydantic import BaseModel
from typing import Optional

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
    latitude: float
    longitude: float

class DogCreate(DogBase):
    pass

class Dog(DogBase):
    id: int
    class Config:
        orm_mode = True
