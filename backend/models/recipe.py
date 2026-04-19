from pydantic import BaseModel


class Recipe(BaseModel):
    title: str
    steps: list[str] = []
