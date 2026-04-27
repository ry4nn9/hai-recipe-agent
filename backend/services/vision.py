import io
import json
import base64
from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction
from PIL import Image as PILImage
from google import genai
from google.genai import types
from fastapi import UploadFile, File, HTTPException
from dotenv import load_dotenv
import os
from services.image_utils import draw_bounding_boxes, preprocess_image, crop_image

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
        image_processed = preprocess_image(image_bytes)
        pil_image = PILImage.open(io.BytesIO(image_processed))
        img_width, img_height = pil_image.size
        yield {"stage": "reading", "message": "Reading image..."}
    except Exception as e:
        yield {"stage": "error", "message": f"Error reading image: {e}"}
        return

    # Detect objects in the image
    # Create bounding boxes
    try:
        yield {"stage": "detecting", "message": "Running object detection..."}
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
                    "xmin": (bounding_box.minx / img_width),
                    "ymin": (bounding_box.miny / img_height),
                    "xmax": (bounding_box.maxx / img_width),
                    "ymax": (bounding_box.maxy / img_height)
                }
            })

        yield {"stage": "detected", "message": f"Found {len(objects_data)} objects."}

    except Exception as e:
        yield {"stage": "error", "message": f"Error detecting objects: {e}"}
        return

    # Generate content using Gemini (first pass)
    try:
        yield {"stage": "first_pass", "message": "Identifying ingredients..."}

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

        annotated_image = draw_bounding_boxes(image_processed, ingredients, img_width, img_height)
        with open("output/annotated_image.jpg", "wb") as f:
            f.write(base64.b64decode(annotated_image))

        yield {"stage": "first_pass_completed", "message": f"Identified {len(ingredients)} ingredients."}

    except json.JSONDecodeError as e:
        yield {"stage": "error", "message": f"Error parsing JSON: {e}"}
        return
    except Exception as e:
        yield {"stage": "error", "message": f"Error generating content: {e}"}
        return

    # Revisit for low confidence objects (second pass)
    contents = []
    final_ingredients = [i for i in ingredients if i.get("confidence") == "high"]
    low_confidence_objects = [i for i in ingredients if i.get("confidence") != "high"]

    try:
        yield {"stage": "second_pass", "message": "Revisiting uncertain items..."}
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

        print(contents)

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

        yield {"stage": "second_pass_completed", "message": "Preparing interactive preview..."}

        preview_image = base64.b64encode(image_processed).decode("utf-8")
        overlay_items = []
        for i in final_ingredients:
            bbox = i.get("bounding_box")
            if not bbox:
                continue
            if not all(k in bbox for k in ["xmin", "ymin", "xmax", "ymax"]):
                continue
            overlay_items.append(
                {
                    "name": i.get("name", "Unknown"),
                    "confidence": i.get("confidence", "unknown"),
                    "bounding_box": {
                        "xmin": float(bbox["xmin"]),
                        "ymin": float(bbox["ymin"]),
                        "xmax": float(bbox["xmax"]),
                        "ymax": float(bbox["ymax"]),
                    },
                }
            )

        with open("output/output.txt", "w") as f:
            f.write("\n".join([i["name"] for i in final_ingredients]))

        yield {
            "stage": "done",
            "message": "Detection complete",
            "image": preview_image,
            "overlay_items": overlay_items,
            "ingredients": [
                {
                    "name": i["name"],
                    "quantity": i["quantity"],
                    "condition": i["condition"]
                }
                for i in final_ingredients
            ]
        }

    except json.JSONDecodeError as e:
        yield {"stage": "error", "message": f"Error parsing recheck JSON: {e}"}
    except Exception as e:
        yield {"stage": "error", "message": f"Error in second pass: {e}"}