from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None

class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8)

class UserAdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = None
    role: str = Field(..., description="CITIZEN, INVESTIGATOR, or ADMIN")

class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
