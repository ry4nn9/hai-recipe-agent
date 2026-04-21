from PIL import Image, ImageDraw
import io
import base64

def preprocess_image(image_bytes: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB")
    image.thumbnail((1024, 1024))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()

def crop_image(image_bytes: bytes, box: dict, img_width: int, img_height: int) -> bytes:
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB")
    cropped_image = image.crop((
        box["xmin"] * img_width,
        box["ymin"] * img_height,
        box["xmax"] * img_width,
        box["ymax"] * img_height
    ))
    buffer = io.BytesIO()
    cropped_image.save(buffer, format="JPEG")
    return buffer.getvalue()

def draw_bounding_boxes(image_bytes: bytes, ingredients: list, img_width: int, img_height: int) -> str:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(image)

    for ingredient in ingredients:
        bbox = ingredient.get("bounding_box")
        if not bbox:
            continue

        xmin = bbox["xmin"] * img_width
        ymin = bbox["ymin"] * img_height
        xmax = bbox["xmax"] * img_width
        ymax = bbox["ymax"] * img_height

        # draw bounding box
        draw.rectangle([xmin, ymin, xmax, ymax], outline="#1D9E75", width=2)

        # draw label background
        label = f"{ingredient['name']} ({ingredient['confidence']})"
        label_y = max(ymin - 20, 0)
        draw.rectangle([xmin, label_y, xmin + len(label) * 7, label_y + 18], fill="#1D9E75")
        draw.text((xmin + 4, label_y + 2), label, fill="white")

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")