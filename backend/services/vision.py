import base64
import io
import json
from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction
from PIL import Image as PILImage
from google import genai
from google.genai import types
from fastapi import UploadFile, File, HTTPException
from dotenv import load_dotenv
import os
from services.image_utils import preprocess_image, crop_image, draw_bounding_boxes

load_dotenv("../.env")

detection_model = AutoDetectionModel.from_pretrained(
    model_type="ultralytics",
    model_path="yolov8x.pt",
    confidence_threshold=0.1,
)

gemini_client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-central1"
)

async def detect_ingredients_from_image(image_file: UploadFile = File(...)):
    # Read the image file
    try:
        image_bytes = await image_file.read()
        image_bytes = preprocess_image(image_bytes)
        pil_image = PILImage.open(io.BytesIO(image_bytes))
        img_width, img_height = pil_image.size
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image: {e}")

    # Detect objects in the image
    # Create bounding boxes
    try:
        results = get_sliced_prediction(
            pil_image,
            detection_model,
            slice_height=240,
            slice_width=240,
            overlap_height_ratio=0.2,
            overlap_width_ratio=0.2,
        )

        results.export_visuals(export_dir="output/", file_name="sahi_annotated")

        objects_data = []
        for object in results.object_prediction_list:
            bounding_box = object.bbox
            objects_data.append({
                "name": object.category.name,
                "score": round(object.score.value, 3),
                "box": {
                    "xmin": bounding_box.minx / img_width,
                    "ymin": bounding_box.miny / img_height,
                    "xmax": bounding_box.maxx / img_width,
                    "ymax": bounding_box.maxy / img_height
                }
            })

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
                types.Part.from_text(text=f"Detected objects: {json.dumps(objects_data)}"),
            ],
            config=types.GenerateContentConfig(
                system_instruction=open("prompts/first_pass.txt").read(),
            )
        )

        ingredients = json.loads(response.text)

        print("First pass completed.")

        print(f"First pass response: {response.text}")

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

            contents.append(
                types.Part.from_text(text=f"Initial detection: {json.dumps(obj)}")
            )

        if contents:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=open("prompts/second_pass.txt").read(),
                )
            )

            print(f"Second pass response: {response.text}")

            rechecked_ingredients = json.loads(response.text)

            if not isinstance(rechecked_ingredients, list):
                rechecked_ingredients = [rechecked_ingredients]

            final_ingredients.extend(rechecked_ingredients)

        print(f"Final ingredients: {final_ingredients}")
        print("Second pass completed.")

        annotated_image = draw_bounding_boxes(image_bytes, final_ingredients, img_width, img_height)

        with open("output/output.txt", "w") as f:
            f.write("\n".join([i["name"] for i in final_ingredients]))

        with open("output/annotated_image.jpg", "wb") as f:
            f.write(base64.b64decode(annotated_image))

        return {
            'image': annotated_image,
            'ingredients': [
                {
                'name': ingredient['name'],
                'quantity': ingredient['quantity'],
                'condition': ingredient['condition']
                } 
            for ingredient in final_ingredients]}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing recheck JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in second pass: {e}")