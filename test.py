from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Dog

db = SessionLocal()
dogs = db.query(Dog).all()
# print(dogs)