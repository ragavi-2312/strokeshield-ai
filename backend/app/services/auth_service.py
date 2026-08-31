import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.doctor import Doctor
from app.models.hospital_staff import HospitalStaff
from app.models.audit_log import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        if "$" not in hashed_password:
            return plain_password == hashed_password
        salt, stored_hash = hashed_password.split("$", 1)
        key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return secrets.compare_digest(key.hex(), stored_hash)
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    return hash_password(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def log_audit_event(
    db: Session,
    user_type: str,
    user_name: str,
    user_email: str,
    action: str,
    details: Optional[Dict[str, Any]] = None
):
    """Helper to record permanent medical audit entries."""
    try:
        entry = AuditLog(
            user_type=user_type,
            user_name=user_name,
            user_email=user_email,
            action=action,
            details=details or {},
            created_at=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print(f"[AuditLog] Error logging event: {e}")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "doctor")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    if role == "hospital_staff":
        staff = db.query(HospitalStaff).filter(HospitalStaff.id == int(user_id)).first()
        if staff is None:
            raise credentials_exception
        return {"user": staff, "role": "hospital_staff"}
    else:
        doctor = db.query(Doctor).filter(Doctor.id == int(user_id)).first()
        if doctor is None:
            raise credentials_exception
        return {"user": doctor, "role": "doctor"}

def get_current_doctor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Doctor:
    auth_data = get_current_user(token, db)
    if auth_data["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor privileges required for this clinical action"
        )
    return auth_data["user"]

def get_current_hospital_staff(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> HospitalStaff:
    auth_data = get_current_user(token, db)
    if auth_data["role"] != "hospital_staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hospital staff privileges required for this action"
        )
    return auth_data["user"]
