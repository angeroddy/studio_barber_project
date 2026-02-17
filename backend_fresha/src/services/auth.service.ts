import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash.util'
import { generateToken } from '../utils/jwt.util'

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

interface LoginData {
  email: string
  password: string
}

export async function register(data: RegisterData) {
  // 1. Vérifier si l'email existe déjà
  const existingOwner = await prisma.owner.findUnique({
    where: { email: data.email }
  })
  
  if (existingOwner) {
    throw new Error('Cet email est déjà utilisé')
  }
  
  // 2. Hasher le mot de passe
  const hashedPassword = await hashPassword(data.password)
  
  // 3. Créer l'owner
  const owner = await prisma.owner.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      salons: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          zipCode: true,
          phone: true,
          email: true,
          bufferBefore: true,
          bufferAfter: true,
          processingTime: true
        }
      }
    }
  })
  
  // 4. Générer le token JWT
  const token = generateToken({
    userId: owner.id,
    email: owner.email,
    userType: 'owner'
  })
  
  return {
    user: owner,
    token
  }
}

export async function login(data: LoginData) {
  // 1. Trouver l'owner par email avec ses salons
  const owner = await prisma.owner.findUnique({
    where: { email: data.email },
    include: {
      salons: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          zipCode: true,
          phone: true,
          email: true,
          bufferBefore: true,
          bufferAfter: true,
          processingTime: true
        }
      }
    }
  })

  if (!owner) {
    throw new Error('Email ou mot de passe incorrect')
  }

  // 2. Vérifier le mot de passe
  const isPasswordValid = await comparePassword(data.password, owner.password)

  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect')
  }

  // 3. Générer le token
  const token = generateToken({
    userId: owner.id,
    email: owner.email,
    userType: 'owner'
  })

  // 4. Retourner l'owner (sans le password) et le token
  const { password, ...ownerWithoutPassword } = owner

  return {
    user: ownerWithoutPassword,
    token
  }
}

export async function getProfile(userId: string) {
  const owner = await prisma.owner.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      salons: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          zipCode: true,
          phone: true,
          email: true,
          bufferBefore: true,
          bufferAfter: true,
          processingTime: true
        }
      }
    }
  })
  
  if (!owner) {
    throw new Error('Utilisateur introuvable')
  }
  
  return owner
}
