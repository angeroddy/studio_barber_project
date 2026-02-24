import api from './api'

interface ClientUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
}

interface CompleteClientInvitationResponse {
  user: ClientUser
  token: string
}

export async function completeClientInvitation(
  token: string,
  password: string
): Promise<CompleteClientInvitationResponse> {
  const response = await api.post('/client-auth/complete-invitation', {
    token,
    password
  })

  if (!response.data?.success || !response.data?.data) {
    throw new Error(response.data?.error || response.data?.message || "Erreur lors de l'activation du compte client")
  }

  return response.data.data
}
