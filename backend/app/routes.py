from fastapi import APIRouter, HTTPException
from app.models import Dog
from app.schemas import DogCreate, DogOut
from app.database import get_all_dogs, get_dog_by_id, add_dog
from app.storage import upload_image
from app.vision import analyze_image

router = APIRouter()

@router.get("/dogs", response_model=list[DogOut])
def get_dogs():
    return get_all_dogs()

@router.get("/dogs/{dog_id}", response_model=DogOut)
def get_dog(dog_id: str):
    dog = get_dog_by_id(dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog

@router.post("/dogs", response_model=DogOut)
def create_dog(dog: DogCreate):
    # Upload image
    image_url = upload_image(dog.image)
    # Analyze image
    attributes = analyze_image(image_url)
    if not attributes.get("is_dog"):
        raise HTTPException(status_code=400, detail="Image is not a dog. Please retake.")
    # Add dog to Firestore
    new_dog = add_dog(dog, attributes, image_url)
    return new_dog
