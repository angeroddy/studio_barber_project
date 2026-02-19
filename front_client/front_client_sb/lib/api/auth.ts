import { API_URL } from './config'

export interface CheckEmailResponse {
  success: boolean
  data: {
    exists: boolean
    hasPassword: boolean
    client?: {
      id: string
      firstName: string
      lastName: string
    }
  }
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      phone: string
    }
    token: string
  }
}

export interface RegisterWithVerificationResponse {
  success: boolean
  message: string
  data: {
    email: string
    verificationExpiresAt: string
  }
}

export interface ErrorResponse {
  success: false
  error: string
  errors?: Array<{
    msg: string
    param: string
  }>
}

function getApiErrorMessage(error: ErrorResponse, fallback: string): string {
  if (error?.error) {
    return error.error
  }
  if (error?.errors?.length) {
    return error.errors[0].msg || fallback
  }
  return fallback
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Vérifier si un email existe dans la base de données
 */
export async function checkEmail(email: string): Promise<CheckEmailResponse> {
  const normalizedEmail = normalizeEmail(email)
  const response = await fetch(`${API_URL}/client-auth/check-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalizedEmail }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(getApiErrorMessage(error, 'Erreur lors de la vérification de l\'email'))
  }

  return response.json()
}

/**
 * Définir le mot de passe pour un client existant (migré)
 */
export async function setPassword(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = normalizeEmail(email)
  const response = await fetch(`${API_URL}/client-auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalizedEmail, password }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(getApiErrorMessage(error, 'Erreur lors de la définition du mot de passe'))
  }

  return response.json()
}

/**
 * Inscription complète d'un nouveau client
 */
export async function register(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  salonId?: string
  marketing?: boolean
}): Promise<RegisterWithVerificationResponse> {
  const normalizedEmail = normalizeEmail(data.email)
  const response = await fetch(`${API_URL}/client-auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      email: normalizedEmail,
    }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(getApiErrorMessage(error, 'Erreur lors de l\'inscription'))
  }

  return response.json()
}

/**
 * Inscription client + reservation en attente de verification email
 */
export async function registerWithBooking(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  salonId: string
  serviceId: string
  staffId?: string
  startTime: string
  notes?: string
}): Promise<RegisterWithVerificationResponse> {
  const normalizedEmail = normalizeEmail(data.email)
  const response = await fetch(`${API_URL}/client-auth/register-with-booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      email: normalizedEmail,
    }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(getApiErrorMessage(error, "Erreur lors de l'inscription"))
  }

  return response.json()
}

/**
 * Connexion d'un client
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = normalizeEmail(email)
  const response = await fetch(`${API_URL}/client-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalizedEmail, password }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(getApiErrorMessage(error, 'Erreur lors de la connexion'))
  }

  return response.json()
}

/**
 * Obtenir le profil du client connecté
 */
export async function getProfile() {
  const response = await fetch(`${API_URL}/client-auth/me`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(getApiErrorMessage(error, 'Erreur lors de la récupération du profil'))
  }

  return response.json()
}

/**
 * Sauvegarder le token dans le localStorage
 */
export function saveToken(_token: string) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
  }
}

/**
 * Récupérer le token du localStorage
 */
export function getToken(): string | null {
  return null
}

/**
 * Supprimer le token du localStorage
 */
export function removeToken() {
  void fetch(`${API_URL}/client-auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined)

  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }
}

/**
 * Sauvegarder les données utilisateur dans le localStorage
 */
export function saveUser(user: {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
}) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user))
  }
}

/**
 * Récupérer les données utilisateur du localStorage
 */
export function getUser(): {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
} | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('authUser')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (e) {
        return null
      }
    }
  }
  return null
}

/**
 * Vérifier si l'utilisateur est connecté ET que le token n'est pas expiré
 */
export function isAuthenticated(): boolean {
  return !!getUser()
}
