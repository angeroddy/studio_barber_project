import type { CookieOptions, Response } from 'express'

const DEFAULT_COOKIE_NAME = 'auth_token'
const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function getCookieName(): string {
  const configuredName = process.env.AUTH_COOKIE_NAME?.trim()
  return configuredName || DEFAULT_COOKIE_NAME
}

function getSameSite(): CookieOptions['sameSite'] {
  const configured = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase()
  if (configured === 'lax' || configured === 'strict' || configured === 'none') {
    return configured
  }
  // In production, admin and API are usually served from different origins.
  // sameSite='none' allows auth cookies on XHR/fetch with credentials: true.
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}

function getSecureFlag(sameSite: CookieOptions['sameSite']): boolean {
  const configured = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase()
  if (configured === 'true') {
    return true
  }
  if (configured === 'false') {
    return false
  }
  return sameSite === 'none' || process.env.NODE_ENV === 'production'
}

function getMaxAge(): number {
  const configured = Number(process.env.AUTH_COOKIE_MAX_AGE_MS)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }
  return DEFAULT_COOKIE_MAX_AGE_MS
}

function buildCookieOptions(): CookieOptions {
  const sameSite = getSameSite()
  return {
    httpOnly: true,
    secure: getSecureFlag(sameSite),
    sameSite,
    path: '/',
    maxAge: getMaxAge()
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(getCookieName(), token, buildCookieOptions())
}

export function clearAuthCookie(res: Response): void {
  const { maxAge, ...options } = buildCookieOptions()
  res.clearCookie(getCookieName(), options)
}

export function getAuthCookieName(): string {
  return getCookieName()
}
