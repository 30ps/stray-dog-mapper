from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.schemas import DogSightingCreate, DogSightingOut
from app.database import get_all_dogs as get_all_dogs_sightings, get_dog_by_id as get_dog_sighting_by_id, add_dog_sighting
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
async def create_dog_sighting(
    file1: UploadFile = File(...),
    location: str = Form(...),
    timestamp: str = Form(None),
):
    from app.storage import get_signed_url
    import json
    # Upload image and get blob path
    import base64
    file_bytes = await file1.read()
    image_data = base64.b64encode(file_bytes).decode("utf-8")
    blob_path = upload_image(image_data)
    # Parse location JSON
    try:
        location_data = json.loads(location)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid location format")
    # Build dog data for DB and vision (ensure image is provided)
    dog_data = DogSightingCreate(location=location_data, timestamp=timestamp, image=image_data)
    # Analyze image using the blob path (which is the GCS object path)
    attributes = analyze_image(blob_path)
    if not attributes.get("is_dog"):
        raise HTTPException(status_code=400, detail="Image is not a dog. Please retake.")
    # Add sighting to Firestore (store blob path and timestamp)
    new_sighting = add_dog_sighting(dog_data, attributes, blob_path, timestamp=timestamp)
    # Set image_url in response using signed URL from blob_path
    if hasattr(new_sighting, "blob_path") and new_sighting.blob_path:
        new_sighting.image_url = get_signed_url(new_sighting.blob_path)
    return new_sighting
