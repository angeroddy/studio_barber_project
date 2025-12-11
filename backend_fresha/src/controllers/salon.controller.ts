import { Request, Response } from 'express'
import {
  createSalon,
  getSalonById,
  getSalonsByOwner,
  getSalonBySlug,
  updateSalon,
  deleteSalon
} from '../services/salon.service'
import { validationResult } from 'express-validator'


/**
 * POST /api/salons
 * Créer un nouveau salon
 */


export async function createSalonHandler(req: Request, res: Response) {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    // Récupérer l'ID du propriétaire depuis le token JWT
    const ownerId = (req as any).user.userId

    const { name, address, city, zipCode, phone, email } = req.body

    const salon = await createSalon({
      name,
      address,
      city,
      zipCode,
      phone,
      email,
      ownerId
    })

    res.status(201).json({
      success: true,
      message: 'Salon créé avec succès',
      data: salon
    })

  } catch (error: any) {
    console.error('Erreur création salon:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/:id
 * Récupérer un salon par son ID
 */

export async function getSalonByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params

    const salon = await getSalonById(id)

    res.json({
      success: true,
      data: salon
    })

  } catch (error: any) {
    console.error('Erreur récupération salon:', error)
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/slug/:slug
 * Récupérer un salon par son slug
 */
export async function getSalonBySlugHandler(req: Request, res: Response) {
  try {
    const { slug } = req.params

    const salon = await getSalonBySlug(slug)

    res.json({
      success: true,
      data: salon
    })

  } catch (error: any) {
    console.error('Erreur récupération salon par slug:', error)
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/owner/:ownerId
 * Récupérer tous les salons d'un propriétaire
 */

export async function getSalonsByOwnerHandler(req: Request, res: Response) {
  try {
    const { ownerId } = req.params

    const salons = await getSalonsByOwner(ownerId)

    res.json({
      success: true,
      data: salons,
      count: salons.length
    })

  } catch (error: any) {
    console.error('Erreur récupération salons du propriétaire:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/salons/my-salons
 * Récupérer tous les salons du propriétaire connecté
 */

export async function getMySalonsHandler(req: Request, res: Response) {
  try {
    // Récupérer l'ID du propriétaire depuis le token JWT
    const ownerId = (req as any).user.userId

    const salons = await getSalonsByOwner(ownerId)

    res.json({
      success: true,
      data: salons,
      count: salons.length
    })

  } catch (error: any) {
    console.error('Erreur récupération mes salons:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PUT /api/salons/:id
 * Mettre à jour un salon
 */

export async function updateSalonHandler(req: Request, res: Response) {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { id } = req.params
    const ownerId = (req as any).user.userId

    const { name, address, city, zipCode, phone, email } = req.body

    const salon = await updateSalon(id, ownerId, {
      name,
      address,
      city,
      zipCode,
      phone,
      email
    })

    res.json({
      success: true,
      message: 'Salon mis à jour avec succès',
      data: salon
    })

  } catch (error: any) {
    console.error('Erreur mise à jour salon:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * DELETE /api/salons/:id
 * Supprimer un salon
 */

export async function deleteSalonHandler(req: Request, res: Response) {
  try {
    const { id } = req.params
    const ownerId = (req as any).user.userId

    const result = await deleteSalon(id, ownerId)

    res.json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    console.error('Erreur suppression salon:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
