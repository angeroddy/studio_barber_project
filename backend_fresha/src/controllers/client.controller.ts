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
import logger from '../config/logger'
import prisma from '../config/database'

type AccessMode = 'read' | 'write'

async function getAccessibleSalonIds(
  req: Request,
  mode: AccessMode = 'read'
): Promise<string[] | undefined> {
  const user = req.user

  if (!user) {
    throw new Error('Non authentifie')
  }

  if (user.userType === 'owner') {
    if (mode === 'read') {
      return undefined
    }

    const salons = await prisma.salon.findMany({
      where: { ownerId: user.userId },
      select: { id: true }
    })
    return salons.map((salon: { id: string }) => salon.id)
  }

  if (user.userType === 'staff') {
    if (!user.salonId) {
      throw new Error('Salon du staff introuvable')
    }
    return [user.salonId]
  }

  throw new Error('Acces refuse')
}

function canAccessSalon(accessibleSalonIds: string[] | undefined, salonId: string): boolean {
  if (!accessibleSalonIds) {
    return true
  }

  return accessibleSalonIds.includes(salonId)
}

function mapStatusForError(error: Error): number {
  if (error.message === 'Non authentifie') return 401
  if (error.message === 'Acces refuse') return 403
  return 400
}

/**
 * POST /api/clients
 */
export async function createClientHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const accessibleSalonIds = await getAccessibleSalonIds(req, 'write')
    const { salonId, email, password, firstName, lastName, phone, notes, marketing } = req.body

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'salonId est obligatoire'
      })
    }

    if (!canAccessSalon(accessibleSalonIds, salonId)) {
      return res.status(403).json({
        success: false,
        error: 'Acces refuse a ce salon'
      })
    }

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

    return res.status(201).json({
      success: true,
      message: 'Client cree avec succes',
      data: client
    })
  } catch (error: any) {
    logger.error('Erreur creation client:', { error: error.message, stack: error.stack })
    return res.status(mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/:id
 */
export async function getClientByIdHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'read')
    const { id } = req.params

    const client = await getClientById(id, accessibleSalonIds)

    return res.json({
      success: true,
      data: client
    })
  } catch (error: any) {
    logger.error('Erreur recuperation client:', { error: error.message, stack: error.stack })
    return res.status(error.message === 'Client introuvable' ? 404 : mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/email/:email
 */
export async function getClientByEmailHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'read')
    const { email } = req.params

    const client = await getClientByEmail(email, accessibleSalonIds)

    return res.json({
      success: true,
      data: client
    })
  } catch (error: any) {
    logger.error('Erreur recuperation client par email:', { error: error.message, stack: error.stack })
    return res.status(error.message === 'Client introuvable' ? 404 : mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/phone/:phone
 */
export async function getClientsByPhoneHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'read')
    const { phone } = req.params

    const clients = await getClientsByPhone(phone, accessibleSalonIds)

    return res.json({
      success: true,
      data: clients,
      count: clients.length
    })
  } catch (error: any) {
    logger.error('Erreur recuperation clients par telephone:', { error: error.message, stack: error.stack })
    return res.status(mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/salon/:salonId
 */
export async function getClientsBySalonHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'read')
    const { salonId } = req.params

    if (!canAccessSalon(accessibleSalonIds, salonId)) {
      return res.status(403).json({
        success: false,
        error: 'Acces refuse a ce salon'
      })
    }

    const clients = await getClientsBySalon(salonId, accessibleSalonIds)

    return res.json({
      success: true,
      data: clients,
      count: clients.length
    })
  } catch (error: any) {
    logger.error('Erreur recuperation clients du salon:', { error: error.message, stack: error.stack })
    return res.status(mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients
 */
export async function getAllClientsHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'read')
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 20

    const result = await getAllClients(page, limit, accessibleSalonIds)

    return res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    logger.error('Erreur recuperation clients:', { error: error.message, stack: error.stack })
    return res.status(mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/clients/search
 */
export async function searchClientsHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'read')
    const searchTerm = req.query.q as string
    const salonId = req.query.salonId as string | undefined
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 20

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le terme de recherche est requis'
      })
    }

    if (salonId && !canAccessSalon(accessibleSalonIds, salonId)) {
      return res.status(403).json({
        success: false,
        error: 'Acces refuse a ce salon'
      })
    }

    const result = await searchClients(searchTerm, salonId, page, limit, accessibleSalonIds)

    return res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    logger.error('Erreur recherche clients:', { error: error.message, stack: error.stack })
    return res.status(mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PUT /api/clients/:id
 */
export async function updateClientHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const accessibleSalonIds = await getAccessibleSalonIds(req, 'write')
    const { id } = req.params
    const { firstName, lastName, phone, notes, marketing, password } = req.body

    const client = await updateClient(
      id,
      {
        firstName,
        lastName,
        phone,
        notes,
        marketing,
        password
      },
      accessibleSalonIds
    )

    return res.json({
      success: true,
      message: 'Client mis a jour avec succes',
      data: client
    })
  } catch (error: any) {
    logger.error('Erreur mise a jour client:', { error: error.message, stack: error.stack })
    return res.status(error.message === 'Client introuvable' ? 404 : mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * DELETE /api/clients/:id
 */
export async function deleteClientHandler(req: Request, res: Response) {
  try {
    const accessibleSalonIds = await getAccessibleSalonIds(req, 'write')
    const { id } = req.params

    const result = await deleteClient(id, accessibleSalonIds)

    return res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    logger.error('Erreur suppression client:', { error: error.message, stack: error.stack })
    return res.status(error.message === 'Client introuvable' ? 404 : mapStatusForError(error)).json({
      success: false,
      error: error.message
    })
  }
}
