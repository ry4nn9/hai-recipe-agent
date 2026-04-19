import base64
import json
from pathlib import Path
from google.cloud.vision_v1 import ImageAnnotatorClient
from google.cloud.vision_v1.types import Image
from google import genai
from fastapi import UploadFile, File, HTTPException
from dotenv import load_dotenv
import os

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
        labels = [object.name for object in objects]

        print(f"Detected objects: {labels}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting objects: {e}")

    # Generate content using Gemini
    try:
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        
        response = gemini_client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                image_base64
            ],
            config=genai.types.GenerateContentConfig(
                system_instruction=open("prompts/detect_ingredients.txt").read()
            )
        )

        ingredients = json.loads(response.text)
        return ingredients
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {e}")