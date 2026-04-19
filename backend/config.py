from pydantic import BaseModel


class Settings(BaseModel):
    gemini_api_key: str = ""


settings = Settings()
