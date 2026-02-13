import api from './api'

export type AbsenceType = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'OTHER'
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Absence {
  id: string
  staffId: string
  salonId: string
  type: AbsenceType
  startDate: string
  endDate: string
  reason?: string
  status: AbsenceStatus
  approvedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
  staff?: {
    id: string
    firstName: string
    lastName: string
    email?: string
    avatar?: string
    role: string
  }
}

export interface CreateAbsenceData {
  staffId: string
  salonId: string
  type: AbsenceType
  startDate: string
  endDate: string
  reason?: string
  notes?: string
}

export interface UpdateAbsenceData {
  type?: AbsenceType
  startDate?: string
  endDate?: string
  reason?: string
  notes?: string
}

export interface AbsenceFilters {
  salonId?: string
  staffId?: string
  status?: AbsenceStatus
  startDate?: string
  endDate?: string
}

export interface AbsenceStats {
  year: number
  totalDays: number
  totalAbsences: number
  byType: {
    VACATION: number
    SICK_LEAVE: number
    PERSONAL: number
    OTHER: number
  }
  absences: Absence[]
}

class AbsenceService {
  async createAbsence(data: CreateAbsenceData): Promise<Absence> {
    const response = await api.post('/absences', data)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la création de l\'absence')
    }

    return response.data.data
  }

  async getAbsences(filters?: AbsenceFilters): Promise<Absence[]> {
    const params = new URLSearchParams()
    if (filters?.salonId) params.append('salonId', filters.salonId)
    if (filters?.staffId) params.append('staffId', filters.staffId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const response = await api.get(`/absences?${params.toString()}`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des absences')
    }

    return response.data.data
  }

  async getAbsence(id: string): Promise<Absence> {
    const response = await api.get(`/absences/${id}`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Absence introuvable')
    }

    return response.data.data
  }

  async updateAbsence(id: string, data: UpdateAbsenceData): Promise<Absence> {
    const response = await api.put(`/absences/${id}`, data)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'absence')
    }

    return response.data.data
  }

  async approveAbsence(id: string, notes?: string): Promise<Absence> {
    const response = await api.patch(`/absences/${id}/approve`, {
      status: 'APPROVED',
      notes
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de l\'approbation de l\'absence')
    }

    return response.data.data
  }

  async rejectAbsence(id: string, notes?: string): Promise<Absence> {
    const response = await api.patch(`/absences/${id}/approve`, {
      status: 'REJECTED',
      notes
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors du rejet de l\'absence')
    }

    return response.data.data
  }

  async deleteAbsence(id: string): Promise<void> {
    const response = await api.delete(`/absences/${id}`)

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la suppression de l\'absence')
    }
  }

  async getStaffAbsenceStats(staffId: string, year?: number): Promise<AbsenceStats> {
    const params = year ? `?year=${year}` : ''
    const response = await api.get(`/absences/staff/${staffId}/stats${params}`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques')
    }

    return response.data.data
  }
}

export default new AbsenceService()
