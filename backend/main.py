from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import detect, health, recipes

app = FastAPI(title="hai-recipe-agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(detect.router, prefix="/detect", tags=["detect"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
