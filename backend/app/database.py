# ...existing code for SQLAlchemy setup...

# Firestore integration
from firebase_admin import firestore
from app.schemas import DogCreate, DogOut

db = firestore.Client()
collection = db.collection("dogs")

def get_all_dogs():
    docs = collection.stream()
    dogs = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        # Convert GeoPoint to dict
        if "location" in data and hasattr(data["location"], "latitude"):
            data["location"] = {
                "latitude": data["location"].latitude,
                "longitude": data["location"].longitude,
            }
        dogs.append(DogOut(**data))
    return dogs

def get_dog_by_id(dog_id: str):
    doc = collection.document(dog_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return DogOut(**data)

def add_dog(dog: DogCreate, attributes: dict, blob_path: str):
    from google.cloud.firestore_v1 import GeoPoint
    dog_data = dog.model_dump()
    # Extract latitude and longitude from the location dict
    location = dog_data.pop("location")
    dog_data["location"] = GeoPoint(location["latitude"], location["longitude"])
    dog_data["attributes"] = attributes
    dog_data["blob_path"] = blob_path
    doc_ref = collection.document()
    try:
        doc_ref.set(dog_data)
    except Exception as e:
        logging.error(f"Firestore write failed: {e}", exc_info=True)
        raise
    dog_data["id"] = doc_ref.id
    # Convert GeoPoint to dict for output
    dog_data["location"] = {
        "latitude": dog_data["location"].latitude,
        "longitude": dog_data["location"].longitude
    }
    return DogOut(**dog_data)
