from pydantic import BaseModel


class Ingredient(BaseModel):
    name: str
    confidence: float | None = None
