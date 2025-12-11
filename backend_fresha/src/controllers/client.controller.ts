import { Request, Response } from 'express'
import {
  createClient,
  getClientById,
  getClientByEmail,
  getClientsByPhone,
  getClientsBySalon,
  getAllClients,
  updateClient,
  deleteClient,
  searchClients
} from '../services/client.service'
import { validationResult } from 'express-validator'

/**
 * POST /api/clients
 * Créer un nouveau client
 */
export async function createClientHandler(req: Request, res: Response) {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { salonId, email, password, firstName, lastName, phone, notes, marketing } = req.body

    const client = await createClient({
      salonId,
      email,
      password,
      firstName,
      lastName,
      phone,
      notes,
      marketing
    })

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: client
    })

  } catch (error: any) {
    console.error('Erreur création client:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/:id
 * Récupérer un client par son ID
 */
export async function getClientByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params

    const client = await getClientById(id)

    res.json({
      success: true,
      data: client
    })

  } catch (error: any) {
    console.error('Erreur récupération client:', error)
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/email/:email
 * Récupérer un client par son email
 */
export async function getClientByEmailHandler(req: Request, res: Response) {
  try {
    const { email } = req.params

    const client = await getClientByEmail(email)

    res.json({
      success: true,
      data: client
    })

  } catch (error: any) {
    console.error('Erreur récupération client par email:', error)
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/phone/:phone
 * Récupérer les clients par numéro de téléphone
 */
export async function getClientsByPhoneHandler(req: Request, res: Response) {
  try {
    const { phone } = req.params

    const clients = await getClientsByPhone(phone)

    res.json({
      success: true,
      data: clients,
      count: clients.length
    })

  } catch (error: any) {
    console.error('Erreur récupération clients par téléphone:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/salon/:salonId
 * Récupérer tous les clients d'un salon
 */
export async function getClientsBySalonHandler(req: Request, res: Response) {
  try {
    const { salonId } = req.params

    const clients = await getClientsBySalon(salonId)

    res.json({
      success: true,
      data: clients,
      count: clients.length
    })

  } catch (error: any) {
    console.error('Erreur récupération clients du salon:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients
 * Récupérer tous les clients avec pagination
 */
export async function getAllClientsHandler(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await getAllClients(page, limit)

    res.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('Erreur récupération clients:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/search
 * Rechercher des clients
 */
export async function searchClientsHandler(req: Request, res: Response) {
  try {
    const searchTerm = req.query.q as string
    const salonId = req.query.salonId as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le terme de recherche est requis'
      })
    }

    const result = await searchClients(searchTerm, salonId, page, limit)

    res.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('Erreur recherche clients:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PUT /api/clients/:id
 * Mettre à jour un client
 */
export async function updateClientHandler(req: Request, res: Response) {
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
    const { firstName, lastName, phone, notes, marketing, password } = req.body

    const client = await updateClient(id, {
      firstName,
      lastName,
      phone,
      notes,
      marketing,
      password
    })

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: client
    })

  } catch (error: any) {
    console.error('Erreur mise à jour client:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * DELETE /api/clients/:id
 * Supprimer un client
 */
export async function deleteClientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params

    const result = await deleteClient(id)

    res.json({
      success: true,
      message: result.message
    })

  } catch (error: any) {
    console.error('Erreur suppression client:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
