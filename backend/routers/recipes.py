from fastapi import APIRouter

from services.recipe_gen import chat_recipe_guide, generate_recipes
from models.ingredient import Ingredient
from models.request import RecipeChatRequest

router = APIRouter()


@router.post("/")
def recipes(request: list[Ingredient]) -> list[dict]:
    recipes = generate_recipes(request)
    return recipes


@router.post("/chat")
def recipe_chat(request: RecipeChatRequest) -> dict:
    reply = chat_recipe_guide(
        selected_recipe=request.selected_recipe,
        ingredients=request.ingredients,
        history=request.history,
        user_message=request.message,
    )
    return {"reply": reply}
