import { Service, Salon, Client, Staff } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        salonId?: string
      }
      service?: Service | Partial<Service>
      salon?: Salon | Partial<Salon>
      client?: Client | Partial<Client>
      staff?: Staff | Partial<Staff>
    }
  }
}