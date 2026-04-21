from models.motor import Motor
from schemas.motor import SearchMotorDataRequest
from fastapi.responses import JSONResponse


async def search_motor_data(payload: SearchMotorDataRequest) -> JSONResponse:
    try:
        motors = await Motor.find(Motor.ratedPower > payload.Pct).to_list()

        sorted_motors = sorted(
            motors,
            key=lambda motor: abs(float(motor.syncSpeed) - float(payload.Nsb)),
        )

        top_motors = sorted_motors[:10]

        result = [
            {
                "motorId": motor.motorId,
                "motorType": motor.motorType,
                "ratedPower": motor.ratedPower,
                "motorSpeed": motor.motorSpeed,
                "syncSpeed": motor.syncSpeed,
            }
            for motor in top_motors
        ]

        return JSONResponse(status_code=200, content={"items": result})
    except Exception as err:
        return JSONResponse(status_code=500, content={"message": str(err)})

