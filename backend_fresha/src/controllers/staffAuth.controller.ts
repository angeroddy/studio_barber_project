import { Request, Response } from 'express'
import * as staffAuthService from '../services/staffAuth.service'
import { clearAuthCookie, setAuthCookie } from '../config/authCookie'

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      })
    }

    const result = await staffAuthService.staffLogin({ email: normalizedEmail, password })

    setAuthCookie(res, result.token)

    return res.json({
      success: true,
      message: 'Connexion reussie',
      data: result
    })
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Erreur lors de la connexion'
    })
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const staffId = req.user?.userId

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifie'
      })
    }

    const profile = await staffAuthService.getStaffProfile(staffId)

    return res.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la recuperation du profil'
    })
  }
}

export async function updatePassword(req: Request, res: Response) {
  try {
    const staffId = req.user?.userId
    const { currentPassword, newPassword } = req.body

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifie'
      })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres'
      })
    }

    const result = await staffAuthService.updateStaffPassword({
      staffId,
      currentPassword: currentPassword || '',
      newPassword
    })

    return res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise a jour du mot de passe'
    })
  }
}

export async function initializePassword(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { password } = req.body
    const actor = req.user

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caracteres'
      })
    }

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifie'
      })
    }

    const result = await staffAuthService.initializeStaffPassword(staffId, password, {
      userId: actor.userId,
      userType: actor.userType,
      role: actor.role,
      salonId: actor.salonId
    })

    return res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de l'initialisation du mot de passe"
    })
  }
}

export async function firstLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caracteres'
      })
    }

    const result = await staffAuthService.firstLoginSetPassword(normalizedEmail, password)

    setAuthCookie(res, result.token)

    return res.json({
      success: true,
      message: 'Mot de passe cree avec succes. Vous etes maintenant connecte.',
      data: result
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la creation du mot de passe'
    })
  }
}

export async function completeInvitation(req: Request, res: Response) {
  try {
    const { token, password } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Token d'activation requis"
      })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caracteres'
      })
    }

    const result = await staffAuthService.completeStaffInvitation({ token, password })
    setAuthCookie(res, result.token)

    return res.json({
      success: true,
      message: 'Mot de passe cree avec succes. Vous etes maintenant connecte.',
      data: result
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de l'activation du compte"
    })
  }
}

export async function logout(req: Request, res: Response) {
  clearAuthCookie(res)
  return res.json({
    success: true,
    message: 'Déconnexion réussie'
  })
}
