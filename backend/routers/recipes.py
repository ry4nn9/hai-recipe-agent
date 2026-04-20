from fastapi import APIRouter
from services.recipe_gen import generate_recipes
from models.ingredient import Ingredient
router = APIRouter()


@router.post("/")
def recipes(request: list[Ingredient]) -> list[dict]:
    recipes =  generate_recipes(request)
    return recipes
