
# ...existing code for SQLAlchemy setup...

# Firestore integration
from firebase_admin import firestore
from app.schemas import DogCreate, Dog

db = firestore.Client()
collection = db.collection("dogs")

def get_all_dogs():
    docs = collection.stream()
    dogs = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        dogs.append(Dog(**data))
    return dogs

def get_dog_by_id(dog_id: str):
    doc = collection.document(dog_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return Dog(**data)

def add_dog(dog: DogCreate, attributes: dict, image_url: str):
    dog_data = dog.dict()
    dog_data.update(attributes)
    dog_data["image_url"] = image_url
    doc_ref = collection.document()
    doc_ref.set(dog_data)
    dog_data["id"] = doc_ref.id
    return Dog(**dog_data)
