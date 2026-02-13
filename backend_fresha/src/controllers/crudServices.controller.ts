import { Request, Response } from 'express'
import {
  createService,
  getService,
  getServicesBySalon,
  getServicesByCategory,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceCategories
} from '../services/crudService.service' // Ajuste le chemin selon ta structure

// ============= CREATE =============
export async function createServiceController(req: Request, res: Response) {
  try {
    const data = req.body
    
    // Validation basique
    if (!data.salonId || !data.name || !data.duration || !data.price || !data.category) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants : salonId, name, duration, price, category'
      })
    }
    
    const service = await createService(data)
    
    return res.status(201).json({
      success: true,
      message: 'Service créé avec succès',
      data: service
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création du service'
    })
  }
}

// ============= GET ONE =============
export async function getServiceController(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const service = await getService(id)
    
    return res.status(200).json({
      success: true,
      data: service
    })
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Service introuvable'
    })
  }
}

// ============= GET BY SALON =============
export async function getServicesBySalonController(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const activeOnly = req.query.activeOnly === 'true'
    const page = req.query.page ? parseInt(req.query.page as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

    const result = await getServicesBySalon(salonId, activeOnly, page, limit)

    return res.status(200).json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des services'
    })
  }
}

// ============= GET BY CATEGORY =============
export async function getServicesByCategoryController(req: Request, res: Response) {
  try {
    const { salonId, category } = req.params
    const page = req.query.page ? parseInt(req.query.page as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

    const result = await getServicesByCategory(salonId, category, page, limit)

    return res.status(200).json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des services'
    })
  }
}

// ============= GET CATEGORIES =============
export async function getServiceCategoriesController(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    
    const categories = await getServiceCategories(salonId)
    
    return res.status(200).json({
      success: true,
      data: categories
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des catégories'
    })
  }
}

// ============= UPDATE =============
export async function updateServiceController(req: Request, res: Response) {
  try {
    const { id } = req.params
    const data = req.body
    
    const updatedService = await updateService({
      id,
      ...data
    })
    
    return res.status(200).json({
      success: true,
      message: 'Service mis à jour avec succès',
      data: updatedService
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du service'
    })
  }
}

// ============= DELETE =============
export async function deleteServiceController(req: Request, res: Response) {
  try {
    const { id } = req.params
    // Ne pas utiliser req.body pour DELETE - le middleware checkServiceOwnership fait déjà la vérification

    const result = await deleteService(id)

    return res.status(200).json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du service'
    })
  }
}

// ============= TOGGLE STATUS =============
export async function toggleServiceStatusController(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { isActive } = req.body
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ isActive doit être un booléen'
      })
    }
    
    const service = await toggleServiceStatus(id, isActive)
    
    return res.status(200).json({
      success: true,
      message: `Service ${isActive ? 'activé' : 'désactivé'} avec succès`,
      data: service
    })
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du changement de statut'
    })
  }
}