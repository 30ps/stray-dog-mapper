from fastapi import APIRouter, HTTPException
from app.schemas import DogSightingCreate, DogSightingOut
from app.database import get_all_dogs as get_all_dogs_sightings, get_dog_by_id as get_dog_sighting_by_id, add_dog as add_dog_sighting
from app.storage import upload_image
from app.vision import analyze_image

router = APIRouter()

@router.get("/dogs_sightings", response_model=list[DogSightingOut])
def get_dogs_sightings():
    from app.storage import get_signed_url
    dogs_sightings = get_all_dogs_sightings()
    # For each sighting, generate a signed URL from blob_path and set image_url for response
    for sighting in dogs_sightings:
        if hasattr(sighting, "blob_path") and sighting.blob_path:
            sighting.image_url = get_signed_url(sighting.blob_path)
    return dogs_sightings

@router.get("/dogs_sightings/{sighting_id}", response_model=DogSightingOut)
def get_dog_sighting(sighting_id: str):
    sighting = get_dog_sighting_by_id(sighting_id)
    if not sighting:
        raise HTTPException(status_code=404, detail="Dog sighting not found")
    return sighting

@router.post("/dogs_sightings", response_model=DogSightingOut)
def create_dog_sighting(dog: DogSightingCreate):
    from app.storage import get_signed_url
    # Upload image and get blob path
    blob_path = upload_image(dog.image)
    # Analyze image using the blob path (which is the GCS object path)
    attributes = analyze_image(blob_path)
    if not attributes.get("is_dog"):
        raise HTTPException(status_code=400, detail="Image is not a dog. Please retake.")
    # Add sighting to Firestore (store blob path and timestamp)
    new_sighting = add_dog_sighting(dog, attributes, blob_path, timestamp=dog.timestamp if hasattr(dog, 'timestamp') else None)
    # Set image_url in response using signed URL from blob_path
    if hasattr(new_sighting, "blob_path") and new_sighting.blob_path:
        new_sighting.image_url = get_signed_url(new_sighting.blob_path)
    return new_sighting
