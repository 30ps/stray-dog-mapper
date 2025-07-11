from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS for mobile dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_dep = Depends(database.get_db)

@app.post("/add_dog", response_model=schemas.Dog)
def add_dog(dog: schemas.DogCreate, db: Session = db_dep):
    db_dog = models.Dog(**dog.dict())
    db.add(db_dog)
    db.commit()
    db.refresh(db_dog)
    return db_dog

@app.get("/get_dogs", response_model=list[schemas.Dog])
def get_dogs(db: Session = db_dep):
    return db.query(models.Dog).all()

@app.get("/")
def root():
    return {"message": "Stray Dog Mapper FastAPI backend running!"}
