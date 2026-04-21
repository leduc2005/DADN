import os

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from models.motor import Motor
from models.user import User


class Database:
    _instance = None
    client: AsyncIOMotorClient | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance


_db = Database()


async def init_db() -> None:
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/MixerSystem")
    try:
        _db.client = AsyncIOMotorClient(uri)
        await init_beanie(
            database=_db.client.get_default_database(default="MixerSystem"),
            document_models=[User, Motor],
        )
        print(f"MongoDB connection successful! Url : {uri})")
    except Exception as err:
        print(f"MongoDB connection error: {err}")


async def close_db() -> None:
    if _db.client is not None:
        _db.client.close()
