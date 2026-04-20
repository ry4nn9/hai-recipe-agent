from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models.ingredient import Ingredient
import json
import os

backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="us-central1"
)

def generate_recipes(ingredients: list[Ingredient]):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            f"Available ingredients: {ingredients}"
        ],
        config=types.GenerateContentConfig(
            system_instruction=open("prompts/generate_recipes.txt").read(),
            temperature=0.7
        )
    )
    with open("output/recipes.txt", "w") as f:
        f.write(response.text)
    return json.loads(response.text)


def chat_recipe_guide(
    selected_recipe: dict,
    ingredients: list[dict],
    history: list[dict],
    user_message: str,
):

    prompt_payload = {
        "selected_recipe": selected_recipe,
        "available_ingredients": ingredients,
        "chat_history": history[-12:],  # keep context bounded
        "user_message": user_message,
    }

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[json.dumps(prompt_payload)],
        config=types.GenerateContentConfig(
            system_instruction=open("prompts/recipe_chat_guide.txt").read(),
            temperature=0.4,
        ),
    )

    return (response.text or "").strip()
