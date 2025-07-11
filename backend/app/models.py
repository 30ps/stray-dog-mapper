from sqlalchemy import Column, Integer, String, Float
from .database import Base

class Dog(Base):
    __tablename__ = "dogs"
    id = Column(Integer, primary_key=True, index=True)
    breed = Column(String, nullable=True)
    age = Column(String, nullable=True)
    size = Column(String, nullable=True)
    color_markings = Column(String, nullable=True)
    coat_type = Column(String, nullable=True)
    ear_shape = Column(String, nullable=True)
    tail_type = Column(String, nullable=True)
    build = Column(String, nullable=True)
    facial_features = Column(String, nullable=True)
    other = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
