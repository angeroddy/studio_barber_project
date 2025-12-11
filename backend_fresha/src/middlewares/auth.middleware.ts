import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.util'

/**
 * Middleware pour protéger les routes
 */
export async function authMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    // 1. Récupérer le token du header Authorization
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant'
      })
    }
    
    const token = authHeader.substring(7) // Enlever "Bearer "
    
    // 2. Vérifier le token
    const decoded = verifyToken(token)
    
    // 3. Ajouter les infos de l'user à la requête
    ;(req as any).user = decoded
    
    next()
    
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    })
  }
}