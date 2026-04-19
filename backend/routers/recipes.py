from fastapi import APIRouter
from models.request import PantryRequest
from models.recipe import Recipe
from services.recipe_gen import generate_recipes

router = APIRouter()


@router.post("/")
def recipes(request: PantryRequest) -> list[Recipe]:
    return [Recipe(title=recipe, steps=[]) for recipe in generate_recipes(request.ingredients)]
    
