import io
import json
from google.cloud.vision_v1 import ImageAnnotatorClient
from google.cloud.vision_v1.types import Image
from PIL import Image as PILImage
from google import genai
from google.genai import types
from fastapi import UploadFile, File, HTTPException
from dotenv import load_dotenv
import os
from services.image_utils import preprocess_image, crop_image

load_dotenv("../.env")

vision_client = ImageAnnotatorClient()
gemini_client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-central1"
)

async def detect_ingredients_from_image(image_file: UploadFile = File(...)):
    # Read the image file
    try:
        image_bytes = await image_file.read()
        image = Image(content=image_bytes)
        pil_image = PILImage.open(io.BytesIO(image_bytes))
        img_width, img_height = pil_image.size
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image: {e}")

    # Detect objects in the image
    # Create bounding boxes
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
        image_processed = preprocess_image(image_bytes)

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_processed, mime_type="image/jpeg"),
                f"Detected objects: {objects_data}"
            ],
            config=types.GenerateContentConfig(
                system_instruction=open("prompts/first_pass.txt").read(),
            )
        )

        ingredients = json.loads(response.text)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {e}")

    # Revisit for low confidence objects (second pass)
    contents = []
    final_ingredients = [i for i in ingredients if i.get("confidence") == "high"]
    low_confidence_objects = [i for i in ingredients if i.get("confidence") != "high"]

    try:
        for obj in low_confidence_objects:
            bbox = obj.get("bounding_box")
            if bbox and all(k in bbox for k in ["xmin", "ymin", "xmax", "ymax"]):
                cropped_image_bytes = crop_image(image_bytes, bbox, img_width, img_height)
                cropped_image_processed = preprocess_image(cropped_image_bytes)
                contents.append(types.Part.from_bytes(data=cropped_image_processed, mime_type="image/jpeg"))

            else:
                contents.append(types.Part.from_bytes(data=image_processed, mime_type="image/jpeg"))

            contents.append(f"Initial detection: {obj}")

        if contents:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=open("prompts/second_pass.txt").read(),
                )
            )

            rechecked_ingredients = json.loads(response.text)

            if not isinstance(rechecked_ingredients, list):
                rechecked_ingredients = [rechecked_ingredients]

            final_ingredients.extend(rechecked_ingredients)

        with open("output/output.txt", "w") as f:
            f.write("\n".join([i["name"] for i in final_ingredients]))

        return final_ingredients

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing recheck JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in second pass: {e}")