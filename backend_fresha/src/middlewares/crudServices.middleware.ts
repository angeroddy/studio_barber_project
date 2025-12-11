import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'// Ajuste selon ton setup

// ============= Vérifier que le service existe =============
export async function checkServiceExists(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    
    const service = await prisma.service.findUnique({
      where: { id }
    })
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      })
    }
    
    // Attacher le service à la requête pour éviter de le rechercher plus tard
    req.service = service
    
    next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du service'
    })
  }
}

// ============= Vérifier que l'owner possède le salon du service =============
export async function checkServiceOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId // Suppose que tu as un middleware d'auth qui ajoute req.user
    const { id } = req.params

    console.log('=== BACKEND: Vérification ownership ===');
    console.log('User ID:', userId);
    console.log('Service ID:', id);

    if (!userId) {
      console.log('Erreur: userId manquant');
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    // Récupérer le service avec son salon
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        salon: {
          select: {
            ownerId: true
          }
        }
      }
    })

    console.log('Service trouvé:', service ? 'Oui' : 'Non');
    if (service) {
      console.log('Owner du salon:', service.salon.ownerId);
      console.log('Match avec user?', service.salon.ownerId === userId);
    }

    if (!service) {
      console.log('Erreur: Service introuvable');
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      })
    }

    // Vérifier que l'owner possède le salon
    if (service.salon.ownerId !== userId) {
      console.log('Erreur: Pas de permission (owner différent)');
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'accéder à ce service'
      })
    }

    console.log('Ownership OK, passage au next()');
    req.service = service

    next()
  } catch (error: any) {
    console.error('Erreur dans checkServiceOwnership:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    })
  }
}

// ============= Vérifier que l'owner possède le salon (pour création) =============
export async function checkSalonOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    const { salonId } = req.body
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'salonId requis'
      })
    }
    
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { ownerId: true }
    })
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon introuvable'
      })
    }
    
    if (salon.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'ajouter des services à ce salon'
      })
    }
    
    next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    })
  }
}

// ============= Validation des données de création =============
export function validateCreateService(req: Request, res: Response, next: NextFunction) {
  const { salonId, name, duration, price, category } = req.body

  // Debug logs
  console.log('=== BACKEND: Validation création service ===')
  console.log('Body reçu:', req.body)
  console.log('Types:', {
    salonId: typeof salonId,
    name: typeof name,
    duration: typeof duration,
    price: typeof price,
    category: typeof category
  })

  const errors: string[] = []
  
  if (!salonId || typeof salonId !== 'string') {
    errors.push('salonId est requis et doit être une chaîne de caractères')
  }
  
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name est requis et doit contenir au moins 2 caractères')
  }
  
  if (!duration || typeof duration !== 'number' || duration <= 0) {
    errors.push('duration est requis et doit être un nombre positif')
  }
  
  if (price === undefined || typeof price !== 'number' || price < 0) {
    errors.push('price est requis et doit être un nombre positif ou zéro')
  }
  
  if (!category || typeof category !== 'string' || category.trim().length < 2) {
    errors.push('category est requis et doit contenir au moins 2 caractères')
  }
  
  // Validation optionnelle du format couleur
  if (req.body.color) {
    const colorRegex = /^#[0-9A-F]{6}$/i
    if (!colorRegex.test(req.body.color)) {
      errors.push('color doit être au format hexadécimal (#RRGGBB)')
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors
    })
  }
  
  next()
}

// ============= Validation des données de mise à jour =============
export function validateUpdateService(req: Request, res: Response, next: NextFunction) {
  const { name, duration, price, category, color } = req.body
  
  const errors: string[] = []
  
  // Au moins un champ doit être fourni
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Au moins un champ à mettre à jour doit être fourni'
    })
  }
  
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('name doit contenir au moins 2 caractères')
  }
  
  if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
    errors.push('duration doit être un nombre positif')
  }
  
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    errors.push('price doit être un nombre positif ou zéro')
  }
  
  if (category !== undefined && (typeof category !== 'string' || category.trim().length < 2)) {
    errors.push('category doit contenir au moins 2 caractères')
  }
  
  if (color !== undefined && color !== null) {
    const colorRegex = /^#[0-9A-F]{6}$/i
    if (!colorRegex.test(color)) {
      errors.push('color doit être au format hexadécimal (#RRGGBB)')
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors
    })
  }
  
  next()
}