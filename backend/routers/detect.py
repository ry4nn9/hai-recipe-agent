from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from services.vision import detect_ingredients_from_image
import json

router = APIRouter()

@router.post("/")
async def detect_ingredients(request: Request, image_file: UploadFile = File(...)):
    async def event_stream():
        async for event in detect_ingredients_from_image(image_file):
            if await request.is_disconnected():
                print("Client disconnected")
                break
            yield f"data: {json.dumps(event)}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
