from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import MissingBackendError

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2", "pbkdf2_sha256"], deprecated="auto", argon2__type="ID")
fallback_pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except MissingBackendError:
        return fallback_pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except MissingBackendError:
        return fallback_pwd_context.hash(password)


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload.get("sub")
    except JWTError:
        return None


def validate_password_input(password: str) -> str:
    pwd = (password or "").strip()
    if len(pwd) < 8:
        raise ValueError("Mật khẩu phải từ 8 ký tự")
    if len(pwd) > 128:
        raise ValueError("Mật khẩu không được quá 128 ký tự")
    return pwd
