from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class PasswordForgotRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)


class PasswordResetRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=1, max_length=128)


class CreateUserRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    access_level: str = "guest"
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
    aal: str | None = None
    mfa_verified: bool | None = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthMeResponse(BaseModel):
    user: UserResponse


class RefreshTokenResponse(AuthTokenResponse):
    pass


class PersistTokenRequest(BaseModel):
    access_token: str
    refresh_token: str
