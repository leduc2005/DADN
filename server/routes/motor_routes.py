from fastapi import APIRouter

from controllers import motor_controller
from schemas.motor import SearchMotorDataRequest

router = APIRouter()


@router.post("/search")
async def search_motor_data(payload: SearchMotorDataRequest):
    return await motor_controller.search_motor_data(payload)
