from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ResetPasswordRequest(BaseModel):
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class CreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    access_level: str = "employe"
    role: str | None = None
    poste: str | None = None
    department: str | None = None
    phone: str | None = None


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    role: str | None = None
    access_level: str | None = None
    poste: str | None = None
    department: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserResponse(BaseModel):
    id: str
    entity_id: str
    email: str
    full_name: str
    role: str
    access_level: str
    poste: str | None = None
    department: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthMeResponse(BaseModel):
    user: UserResponse


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class PersistTokenRequest(BaseModel):
    access_token: str
    refresh_token: str
