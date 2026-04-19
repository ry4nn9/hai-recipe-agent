from fastapi import APIRouter, UploadFile, File
from services.vision import detect_ingredients_from_image

router = APIRouter()

@router.post("/")
async def detect_ingredients(image_file: UploadFile = File(...)):
    return await detect_ingredients_from_image(image_file)
