import { Request, Response } from 'express'
import * as staffAuthService from '../services/staffAuth.service'

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      })
    }

    const result = await staffAuthService.staffLogin({ email, password })

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: result
    })
  } catch (error: any) {
    res.status(401).json({
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
        message: 'Non authentifié'
      })
    }

    const profile = await staffAuthService.getStaffProfile(staffId)

    res.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du profil'
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
        message: 'Non authentifié'
      })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      })
    }

    const result = await staffAuthService.updateStaffPassword({
      staffId,
      currentPassword: currentPassword || '',
      newPassword
    })

    res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du mot de passe'
    })
  }
}

export async function initializePassword(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { password } = req.body
    const salonId = req.user?.salonId // Si l'Owner est connecté, on récupère son salonId

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      })
    }

    const result = await staffAuthService.initializeStaffPassword(staffId, password, salonId)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de l\'initialisation du mot de passe'
    })
  }
}

export async function firstLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      })
    }

    const result = await staffAuthService.firstLoginSetPassword(email, password)

    res.json({
      success: true,
      message: 'Mot de passe créé avec succès. Vous êtes maintenant connecté.',
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création du mot de passe'
    })
  }
}
