import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from jose import jwt

from models.user import User
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)


def _hash_password(password: str) -> str:
    salt = bcrypt.gensalt(10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


async def register(payload: RegisterRequest) -> JSONResponse:
    try:
        existing = await User.find_one(User.email == payload.email)
        if existing:
            return JSONResponse(
                status_code=400,
                content={"message": "Email này đã được sử dụng!"},
            )

        hashed_password = _hash_password(payload.password)
        user = User(name=payload.name, email=payload.email, password=hashed_password)
        await user.insert()

        return JSONResponse(
            status_code=201,
            content={
                "message": "Đăng ký tài khoản thành công!",
                "user": {"id": str(user.id), "name": user.name, "email": user.email},
            },
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"message": "Lỗi Server Backend!", "error": str(error)},
        )


async def login(payload: LoginRequest) -> JSONResponse:
    try:
        user = await User.find_one(User.email == payload.email)
        if not user:
            return JSONResponse(
                status_code=400,
                content={"message": "Sai thẻ email hoặc mật khẩu!"},
            )

        if not _verify_password(payload.password, user.password):
            return JSONResponse(
                status_code=400,
                content={"message": "Sai thẻ email hoặc mật khẩu!"},
            )

        secret = os.getenv("JWT_SECRET", "")
        expire = datetime.now(timezone.utc) + timedelta(days=30)
        token = jwt.encode({"id": str(user.id), "exp": expire}, secret, algorithm="HS256")

        return JSONResponse(
            status_code=200,
            content={
                "message": "Đăng nhập thành công",
                "token": token,
                "user": {"id": str(user.id), "name": user.name, "email": user.email},
            },
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"message": "Lỗi Server Backend", "error": str(error)},
        )


async def forgot_password(payload: ForgotPasswordRequest) -> JSONResponse:
    try:
        user = await User.find_one(User.email == payload.email)
        if not user:
            return JSONResponse(
                status_code=404,
                content={"message": "Không tìm thấy tài khoản với email này!"},
            )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Mã xác nhận (OTP) đã được gửi đến email của bạn!",
                "tempCode": "123456",
            },
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"message": "Lỗi Server Backend", "error": str(error)},
        )


async def reset_password(payload: ResetPasswordRequest) -> JSONResponse:
    try:
        user = await User.find_one(User.email == payload.email)
        if not user:
            return JSONResponse(
                status_code=404,
                content={"message": "Người dùng không tồn tại!"},
            )

        user.password = _hash_password(payload.newPassword)
        await user.save()

        return JSONResponse(
            status_code=200,
            content={"message": "Đổi mật khẩu thành công! Giờ hãy đăng nhập lại."},
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"message": "Lỗi Server Backend", "error": str(error)},
        )
