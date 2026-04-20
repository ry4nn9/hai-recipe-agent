import base64
import io
import json
from pathlib import Path
from google.cloud.vision_v1 import ImageAnnotatorClient
from google.cloud.vision_v1.types import Image
from PIL import Image as PILImage
from google import genai
from fastapi import UploadFile, File, HTTPException
from dotenv import load_dotenv
import os
from services.image_utils import preprocess_image, crop_image

backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

vision_client = ImageAnnotatorClient()
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def detect_ingredients_from_image(image_file: UploadFile = File(...)):
    # Read the image file
    try:    
        image_bytes = await image_file.read()
        image = Image(content=image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image: {e}")

    # Detect objects in the image
    try:
        objects = vision_client.object_localization(image=image).localized_object_annotations
        objects_data = [{
            "name": object.name,
            "score": object.score,
            "box": {
                "xmin": object.bounding_poly.normalized_vertices[0].x,
                "ymin": object.bounding_poly.normalized_vertices[0].y,
                "xmax": object.bounding_poly.normalized_vertices[2].x,
                "ymax": object.bounding_poly.normalized_vertices[2].y
            }
        } for object in objects]

        print(f"Detected objects: {objects_data}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting objects: {e}")

    # Generate content using Gemini (first pass)
    try:
        image_base64 = preprocess_image(image_bytes)
        
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                },
                f"Detected objects: {objects_data}"
            ],
            config=genai.types.GenerateContentConfig(
                system_instruction=open("prompts/first_pass.txt").read()
            )
        )

        ingredients = json.loads(response.text)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {e}")

    # Revisit for low confidence objects (second pass)
    pil_image = PILImage.open(io.BytesIO(image_bytes))
    img_width, img_height = pil_image.size
    contents = []
    final_ingredients = [ingredient for ingredient in ingredients if ingredient["confidence"] == "high"]
    low_confidence_objects = [ingredient for ingredient in ingredients if ingredient["confidence"] != "high"]
    print(f"Low confidence objects: {low_confidence_objects}")
    try:
        for object in low_confidence_objects:
            bbox = object.get("bounding_box")
            if bbox and all(k in bbox for k in ["xmin", "ymin", "xmax", "ymax"]):
                cropped_image_bytes = crop_image(image_bytes, object["bounding_box"], img_width, img_height)
                cropped_image_base64 = preprocess_image(cropped_image_bytes)
                contents.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": cropped_image_base64
                    }
                })
                contents.append(f"Initial detection: {object}")

        if contents:
            print(f"Contents: {contents}")
            response = gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=contents,
                    config=genai.types.GenerateContentConfig(
                        system_instruction=open("prompts/second_pass.txt").read()
                    )
                )
            rechecked_ingredients = json.loads(response.text)
            if not isinstance(rechecked_ingredients, list):
                rechecked_ingredients = [rechecked_ingredients]
            final_ingredients.extend(rechecked_ingredients)
        return final_ingredients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {e}")