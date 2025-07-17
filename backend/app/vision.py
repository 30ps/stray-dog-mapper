
from google.cloud import vision

def analyze_image(image_url: str) -> dict:
    """
    Calls Google Cloud Vision API to analyze image and extract dog attributes.
    Returns dict with keys: is_dog, breed, color, size
    """
    client = vision.ImageAnnotatorClient()
    image = vision.Image()
    image.source.image_uri = image_url

    response = client.label_detection(image=image)
    labels = [label.description.lower() for label in response.label_annotations]

    # Detect if image is a dog
    is_dog = any("dog" in label for label in labels)

    # Extract breed, color, size (simple heuristics, can be improved)
    breed = next((label for label in labels if "dog" not in label and "breed" in label), "Unknown")
    color = next((label for label in labels if label in ["black", "white", "brown", "yellow", "golden", "gray"]), "Unknown")
    size = next((label for label in labels if label in ["small", "medium", "large"]), "Unknown")

    return {
        "is_dog": is_dog,
        "breed": breed,
        "color": color,
        "size": size
    }
