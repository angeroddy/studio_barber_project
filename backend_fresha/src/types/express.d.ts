import { Service, Salon, Client, Staff, StaffRole } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        userType: 'owner' | 'staff' | 'client'
        salonId?: string
        role?: StaffRole
      }
      service?: Service | Partial<Service>
      salon?: Salon | Partial<Salon>
      client?: Client | Partial<Client>
      staff?: Staff | Partial<Staff>
    }
  }
}
