import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash.util'
import { generateToken } from '../utils/jwt.util'

interface CheckEmailResponse {
  exists: boolean
  hasPassword: boolean
  client?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface RegisterClientData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  salonId?: string
  marketing?: boolean
}

interface SetPasswordData {
  email: string
  password: string
}

interface LoginClientData {
  email: string
  password: string
}

/**
 * Vérifier si un email existe dans la base de données
 * et si le client a déjà défini un mot de passe
 */
export async function checkEmailExists(email: string): Promise<CheckEmailResponse> {
  const client = await prisma.client.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      password: true
    }
  })

  if (!client) {
    return {
      exists: false,
      hasPassword: false
    }
  }

  return {
    exists: true,
    hasPassword: !!client.password,
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName
    }
  }
}

/**
 * Définir le mot de passe pour un client existant (migré)
 */
export async function setPasswordForExistingClient(data: SetPasswordData) {
  // 1. Vérifier que le client existe
  const client = await prisma.client.findUnique({
    where: { email: data.email }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  // 2. Vérifier que le client n'a pas déjà un mot de passe
  if (client.password) {
    throw new Error('Ce compte a déjà un mot de passe. Veuillez vous connecter.')
  }

  // 3. Hasher le mot de passe
  const hashedPassword = await hashPassword(data.password)

  // 4. Mettre à jour le client avec le mot de passe
  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  // 5. Générer le token JWT
  const token = generateToken({
    userId: updatedClient.id,
    email: updatedClient.email,
    userType: 'client',
    type: 'client'
  })

  return {
    user: updatedClient,
    token
  }
}

/**
 * Inscription complète d'un nouveau client
 */
export async function registerNewClient(data: RegisterClientData) {
  // 1. Vérifier si l'email existe déjà
  const existingClient = await prisma.client.findUnique({
    where: { email: data.email }
  })

  if (existingClient) {
    throw new Error('Un client avec cet email existe déjà')
  }

  // 2. Si un salonId est fourni, vérifier que le salon existe
  if (data.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }
  }

  // 3. Hasher le mot de passe
  const hashedPassword = await hashPassword(data.password)

  // 4. Créer le nouveau client
  const client = await prisma.client.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      salonId: data.salonId,
      marketing: data.marketing || false
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  // 5. Générer le token JWT
  const token = generateToken({
    userId: client.id,
    email: client.email,
    userType: 'client',
    type: 'client'
  })

  return {
    user: client,
    token
  }
}

/**
 * Connexion d'un client
 */
export async function loginClient(data: LoginClientData) {
  // 1. Trouver le client par email
  const client = await prisma.client.findUnique({
    where: { email: data.email },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  if (!client) {
    throw new Error('Email ou mot de passe incorrect')
  }

  // 2. Vérifier que le client a bien un mot de passe
  if (!client.password) {
    throw new Error('Aucun mot de passe défini pour ce compte. Veuillez compléter votre inscription.')
  }

  // 3. Vérifier le mot de passe
  const isPasswordValid = await comparePassword(data.password, client.password)

  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect')
  }

  // 4. Générer le token
  const token = generateToken({
    userId: client.id,
    email: client.email,
    userType: 'client',
    type: 'client'
  })

  // 5. Retourner le client (sans le password) et le token
  const { password, ...clientWithoutPassword } = client

  return {
    user: clientWithoutPassword,
    token
  }
}

/**
 * Obtenir le profil d'un client connecté
 */
export async function getClientProfile(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      marketing: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  return client
}
