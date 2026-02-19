import api from './api'

export interface StaffLoginData {
  email: string
  password: string
}

export interface StaffUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'MANAGER' | 'EMPLOYEE'
  specialties: string[]
  bio?: string
  isActive: boolean
  salonId: string
  salon: {
    id: string
    name: string
    slug: string
    address: string
    city: string
    phone: string
    email: string
  }
  schedules?: any[]
}

export interface StaffAuthResponse {
  user: StaffUser
  token: string
  userType: 'staff'
}

class StaffAuthService {
  async login(data: StaffLoginData): Promise<StaffAuthResponse> {
    const response = await api.post('/staff-auth/login', data)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la connexion')
    }

    return response.data.data
  }

  async firstLogin(email: string, password: string): Promise<StaffAuthResponse> {
    const response = await api.post('/staff-auth/first-login', {
      email,
      password
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la création du mot de passe')
    }

    return response.data.data
  }

  async completeInvitation(token: string, password: string): Promise<StaffAuthResponse> {
    const response = await api.post('/staff-auth/complete-invitation', {
      token,
      password
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Erreur lors de l'activation du compte")
    }

    return response.data.data
  }

  async getProfile(): Promise<StaffUser> {
    const response = await api.get('/staff-auth/me')

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la récupération du profil')
    }

    return response.data.data
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.put('/staff-auth/password', {
      currentPassword,
      newPassword
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du mot de passe')
    }
  }

  async initializePassword(staffId: string, password: string): Promise<void> {
    const response = await api.post(`/staff-auth/${staffId}/initialize-password`, {
      password
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de l\'initialisation du mot de passe')
    }
  }

  async logout(): Promise<void> {
    await api.post('/staff-auth/logout')
  }
}

export default new StaffAuthService()
