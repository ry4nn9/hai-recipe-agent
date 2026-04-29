from pydantic import BaseModel
from models.boundingBox import BoundingBox

class Ingredient(BaseModel):
    name: str
    quantity: str
    condition: str


class IngredientWithBoundingBox(Ingredient):
    bounding_box: BoundingBox
    confidence: str