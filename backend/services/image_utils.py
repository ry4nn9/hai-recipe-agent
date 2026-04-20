from PIL import Image
import base64
import io

def preprocess_image(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))

    image = image.convert("RGB")
    
    image.thumbnail((1024, 1024))
    
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def crop_image(image_bytes: bytes, box: dict, img_width: int, img_height: int) -> bytes:
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB")
    cropped_image = image.crop(
        (box["xmin"] * img_width, 
        box["ymin"] * img_height, 
        box["xmax"] * img_width, 
        box["ymax"] * img_height))
    buffer = io.BytesIO()
    cropped_image.save(buffer, format="JPEG")
    return buffer.getvalue()