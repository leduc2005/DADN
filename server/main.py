import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.db import init_db, close_db
from routes.auth_routes import router as auth_router
from routes.motor_routes import router as motor_router


load_dotenv()

PORT = int(os.getenv("PORT", 5000))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="Fast API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(motor_router, prefix="/api/motors")


@app.get("/")
async def root():
    return {"message": "Mixer System API is running successfully! 🚀"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
