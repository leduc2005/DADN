import asyncio

from dotenv import load_dotenv

from config.db import close_db, init_db
from models.motor import seed_motor_data


async def main() -> None:
    load_dotenv()
    await init_db()
    try:
        await seed_motor_data()
        print("Motor data seeded successfully.")
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())