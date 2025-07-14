from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

db_dep = Depends(database.get_db)

@app.post("/add_dog", response_model=schemas.Dog)
def add_dog(dog: schemas.DogCreate, db: Session = db_dep):
    try:
        db_dog = models.Dog(**dog.dict())
        db.add(db_dog)
        db.commit()
        db.refresh(db_dog)
        return db_dog
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_dogs", response_model=list[schemas.Dog])
def get_dogs(db: Session = db_dep):
    try:
        return db.query(models.Dog).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "Stray Dog Mapper FastAPI backend running!"}
