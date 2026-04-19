from pathlib import Path
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_recipes(_ingredients: list[str]):
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            f"Generate a recipe for the following ingredients: {_ingredients}"
        ],
        config=genai.types.GenerateContentConfig(
            system_instruction=open("prompts/generate_recipes.txt").read()
        )
    )
    return response.text
