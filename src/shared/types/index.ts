// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  status?: number
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// Auth types
export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'redacteur' | 'user'
  created_at?: string
  updated_at?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
}

export interface VerifyOtpRequest {
  challenge_token: string
  code: string
}

export interface OtpChallenge {
  requires_otp: true
  otp_setup_required: boolean
  otp_method?: 'email' | 'authenticator'
  expires_in?: number
  challenge_token: string
  otp_qr_svg?: string
  otp_secret?: string
}

export type LoginResult = LoginResponse | OtpChallenge

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  verifyOtp: (challengeToken: string, code: string) => Promise<LoginResponse>
  reverifyOtp: (code: string, challengeToken?: string) => Promise<LoginResponse>
  sendEmailOtp: (challengeToken?: string, reauth?: boolean) => Promise<OtpChallenge>
  changePassword: (currentPassword: string, password: string, passwordConfirmation: string) => Promise<{ message: string }>
  logout: () => Promise<void>
  isAdmin: () => boolean
  isRedacteur: () => boolean
  isStaff: () => boolean
}

// Article types
export interface Article {
  id: number
  titre: string
  slug: string
  contenu: string
  image?: string
  categorie_id?: number
  statut: 'brouillon' | 'publie' | 'archive'
  created_at?: string
  updated_at?: string
}

// Common list response
export interface ListResponse<T> {
  data: T[]
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
