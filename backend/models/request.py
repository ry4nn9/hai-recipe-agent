from pydantic import BaseModel


class RecipeChatRequest(BaseModel):
    selected_recipe: dict
    ingredients: list[dict]
    history: list[dict] = []
    message: str
