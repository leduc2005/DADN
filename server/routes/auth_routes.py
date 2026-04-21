from fastapi import APIRouter

from controllers import auth_controller
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)

router = APIRouter()


@router.post("/register")
async def register(payload: RegisterRequest):
    return await auth_controller.register(payload)


@router.post("/login")
async def login(payload: LoginRequest):
    return await auth_controller.login(payload)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    return await auth_controller.forgot_password(payload)


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    return await auth_controller.reset_password(payload)
