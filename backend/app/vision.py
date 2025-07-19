from google.cloud import vision

def analyze_image(blob_path: str) -> dict:
    """
    Calls Google Cloud Vision API to analyze image and extract dog attributes.
    Accepts a GCS blob path, generates a signed URL, and analyzes the image.
    Returns dict with keys: is_dog, breed, color, size
    """
    from app.storage import get_signed_url
    image_url = get_signed_url(blob_path)
    print(f"[analyze_image] Analyzing image URL: {image_url}")
    client = vision.ImageAnnotatorClient()
    image = vision.Image()
    image.source.image_uri = image_url

    response = client.label_detection(image=image)
    labels = [label.description.lower() for label in response.label_annotations]
    print(f"[analyze_image] Labels detected: {labels}")

    # Detect if image is a dog
    is_dog = any("dog" in label for label in labels)
    print(f"[analyze_image] is_dog: {is_dog}")

    # Extract breed, color, size (simple heuristics, can be improved)
    breed = next((label for label in labels if "dog" not in label and "breed" in label), "Unknown")
    color = next((label for label in labels if label in ["black", "white", "brown", "yellow", "golden", "gray"]), "Unknown")
    size = next((label for label in labels if label in ["small", "medium", "large"]), "Unknown")

    print(f"[analyze_image] breed: {breed}, color: {color}, size: {size}")

    return {
        "is_dog": is_dog,
        "breed": breed,
        "color": color,
        "size": size
    }