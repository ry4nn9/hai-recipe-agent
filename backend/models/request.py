from pydantic import BaseModel


class PantryRequest(BaseModel):
    image_base64: str | None = None
    ingredients: list[str] | None = None
