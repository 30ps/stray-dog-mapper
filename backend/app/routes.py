from fastapi import APIRouter, HTTPException
from app.schemas import DogCreate, DogOut
from app.database import get_all_dogs, get_dog_by_id, add_dog
from app.storage import upload_image
from app.vision import analyze_image

router = APIRouter()

@router.get("/dogs", response_model=list[DogOut])
def get_dogs():
    from app.storage import get_signed_url
    dogs = get_all_dogs()
    # For each dog, generate a signed URL from blob_path and set image_url for response
    for dog in dogs:
        if hasattr(dog, "blob_path") and dog.blob_path:
            dog.image_url = get_signed_url(dog.blob_path)
    return dogs

@router.get("/dogs/{dog_id}", response_model=DogOut)
def get_dog(dog_id: str):
    dog = get_dog_by_id(dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog

@router.post("/dogs", response_model=DogOut)
def create_dog(dog: DogCreate):
    from app.storage import get_signed_url
    # Upload image and get blob path
    blob_path = upload_image(dog.image)
    # Analyze image using the blob path (which is the GCS object path)
    attributes = analyze_image(blob_path)
    if not attributes.get("is_dog"):
        raise HTTPException(status_code=400, detail="Image is not a dog. Please retake.")
    # Add dog to Firestore (store blob path)
    new_dog = add_dog(dog, attributes, blob_path)
    # Set image_url in response using signed URL from blob_path
    if hasattr(new_dog, "blob_path") and new_dog.blob_path:
        new_dog.image_url = get_signed_url(new_dog.blob_path)
    return new_dog
