from google import genai
from google.genai.types import HttpOptions, Part
import re
import os

GCS_BUCKET = os.getenv("GCS_BUCKET", "dogs-images")

def analyze_image(blob_path: str) -> dict:
    """
    Calls Gemini API to analyze image and extract dog attributes.
    Accepts a GCS blob path, generates a signed URL, and analyzes the image.
    Returns dict with keys: is_dog, breed, age, size, main_color, color_markings, coat_type, ear_shape, tail_type, build, facial_features
    Only includes attributes with >90% confidence.
    """
    # Use the GCS blob path directly as file_uri
    file_uri = f"gs://{GCS_BUCKET}/{blob_path}"
    print(f"[analyze_image] Analyzing GCS URI: {file_uri}")

    # Compose a single prompt for all attributes
    prompt = (
        "Extract the following dog attributes from the image. "
        "Respond in python dict with keys: is_dog, breed, age, size, main_color, color_markings, coat_type, ear_shape, tail_type, build, facial_features. "
        "is_dog: true or false. "
        "breed: only the prominent breed"
        "age: the estimated age in years. "
        "size: small, medium, large. "
        "main_color: the primary color of the dog. "
        "color_markings: return a key-value pair of body part and color. e.g. body: brown, paws: white. "
        "coat_type: short, medium, long, curly, etc. One word. "
        "ear_shape: upright, floppy, etc. One word. "
        "tail_type: long, short, curly, etc. One word. "
        "build: slender, stocky, etc. One word. "
        "facial_features: return a key-value pair of feature and one word description. e.g. eyes: round, nose: black. "
        "If you are less than 90% confident in an attribute, don't return the attribute. "
    )

    client = genai.Client(http_options=HttpOptions(api_version="v1"))
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                Part.from_uri(
                    file_uri=file_uri,
                    mime_type="image/jpeg",
                ),
            ],
        )
        text = response.text.strip()
        print(f"[analyze_image] raw response: {text}")
        # Try to extract JSON from the response
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            import json
            try:
                results = json.loads(match.group(0))
            except Exception as e:
                print(f"[analyze_image] JSON parse error: {e}")
                results = {}
        else:
            print("[analyze_image] No JSON found in response.")
            results = {}
    except Exception as e:
        print(f"[analyze_image] Error extracting attributes: {e}")
        results = {}

    return results