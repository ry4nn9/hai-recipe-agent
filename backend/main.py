from fastapi import FastAPI

from routers import detect, health, recipes

app = FastAPI(title="hai-recipe-agent")

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(detect.router, prefix="/detect", tags=["detect"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
