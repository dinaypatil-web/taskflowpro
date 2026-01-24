export interface User {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface VerifyTokenRequest {
  token: string
}

export interface RequestPasswordResetRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}