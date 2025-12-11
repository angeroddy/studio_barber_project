import { Service, Salon, Client } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
      }
      service?: Service
      salon?: Salon
      client?: Client
    }
  }
}