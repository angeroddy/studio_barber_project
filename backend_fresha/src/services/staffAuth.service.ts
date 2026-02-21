import { createHash } from 'crypto'
import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash.util'
import { generateToken } from '../utils/jwt.util'
import type { StaffRole } from '../types/domain.enums'

interface StaffLoginData {
  email: string
  password: string
}

interface StaffUpdatePasswordData {
  staffId: string
  currentPassword: string
  newPassword: string
}

interface PasswordInitializationActor {
  userId: string
  userType: 'owner' | 'staff' | 'client'
  role?: StaffRole
  salonId?: string
}

interface CompleteStaffInvitationData {
  token: string
  password: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPasswordSetupToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export async function staffLogin(data: StaffLoginData) {
  const normalizedEmail = normalizeEmail(data.email)

  const staff = await prisma.staff.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true,
          email: true
        }
      }
    }
  })

  if (!staff) {
    throw new Error('Email ou mot de passe incorrect')
  }

  if (!staff.password) {
    if (staff.passwordSetupRequired) {
      throw new Error("Compte non active. Utilisez le lien d'activation recu par email.")
    }
    throw new Error('Aucun mot de passe configure pour ce compte. Veuillez contacter votre administrateur.')
  }

  if (!staff.isActive) {
    throw new Error('Votre compte a ete desactive. Veuillez contacter votre administrateur.')
  }

  const isPasswordValid = await comparePassword(data.password, staff.password)
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect')
  }

  const token = generateToken({
    userId: staff.id,
    email: staff.email!,
    userType: 'staff',
    salonId: staff.salonId,
    role: staff.role
  })

  const { password, ...staffWithoutPassword } = staff

  return {
    user: staffWithoutPassword,
    token,
    userType: 'staff' as const
  }
}

export async function getStaffProfile(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      specialties: true,
      bio: true,
      isActive: true,
      salonId: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true,
          email: true
        }
      },
      schedules: {
        orderBy: {
          dayOfWeek: 'asc'
        }
      }
    }
  })

  if (!staff) {
    throw new Error('Employe introuvable')
  }

  if (!staff.isActive) {
    throw new Error('Votre compte a ete desactive')
  }

  return staff
}

export async function updateStaffPassword(data: StaffUpdatePasswordData) {
  const { staffId, currentPassword, newPassword } = data

  const staff = await prisma.staff.findUnique({
    where: { id: staffId }
  })

  if (!staff) {
    throw new Error('Employe introuvable')
  }

  if (!staff.password) {
    const hashedPassword = await hashPassword(newPassword)

    await prisma.staff.update({
      where: { id: staffId },
      data: { password: hashedPassword }
    })

    return { message: 'Mot de passe cree avec succes' }
  }

  const isPasswordValid = await comparePassword(currentPassword, staff.password)
  if (!isPasswordValid) {
    throw new Error('Mot de passe actuel incorrect')
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.staff.update({
    where: { id: staffId },
    data: { password: hashedPassword }
  })

  return { message: 'Mot de passe mis a jour avec succes' }
}

export async function initializeStaffPassword(
  staffId: string,
  password: string,
  actor: PasswordInitializationActor
) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId }
  })

  if (!staff) {
    throw new Error('Employe introuvable')
  }

  if (actor.userType === 'owner') {
    const ownedSalon = await prisma.salon.findFirst({
      where: {
        id: staff.salonId,
        ownerId: actor.userId
      },
      select: { id: true }
    })

    if (!ownedSalon) {
      throw new Error('Non autorise a modifier cet employe')
    }
  } else if (actor.userType === 'staff') {
    if (actor.role !== 'MANAGER') {
      throw new Error('Seuls les managers peuvent initialiser un mot de passe employe')
    }

    if (!actor.salonId || actor.salonId !== staff.salonId) {
      throw new Error('Non autorise a modifier cet employe')
    }
  } else {
    throw new Error("Type d'utilisateur non autorise")
  }

  const hashedPassword = await hashPassword(password)

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      password: hashedPassword,
      email: staff.email || undefined
    }
  })

  return { message: 'Mot de passe initialise avec succes' }
}

export async function firstLoginSetPassword(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)

  const staff = await prisma.staff.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    }
  })

  if (!staff) {
    throw new Error('Aucun compte employe trouve avec cet email')
  }

  if (staff.password) {
    throw new Error('Ce compte a deja un mot de passe. Utilisez la connexion normale.')
  }

  if (staff.passwordSetupRequired) {
    throw new Error("Utilisez le lien d'activation recu par email pour definir votre mot de passe.")
  }

  if (!staff.isActive) {
    throw new Error('Votre compte a ete desactive. Veuillez contacter votre administrateur.')
  }

  const hashedPassword = await hashPassword(password)

  const updatedStaff = await prisma.staff.update({
    where: { id: staff.id },
    data: { password: hashedPassword },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true,
          email: true
        }
      }
    }
  })

  const token = generateToken({
    userId: updatedStaff.id,
    email: updatedStaff.email!,
    userType: 'staff',
    salonId: updatedStaff.salonId,
    role: updatedStaff.role
  })

  const { password: _, ...staffWithoutPassword } = updatedStaff

  return {
    user: staffWithoutPassword,
    token,
    userType: 'staff' as const
  }
}

export async function completeStaffInvitation(data: CompleteStaffInvitationData) {
  const tokenHash = hashPasswordSetupToken(data.token)
  const now = new Date()

  const staff = await prisma.staff.findFirst({
    where: {
      passwordSetupTokenHash: tokenHash
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true,
          email: true
        }
      }
    }
  })

  if (!staff || !staff.passwordSetupRequired) {
    throw new Error("Lien d'activation invalide")
  }

  if (!staff.passwordSetupTokenExpiresAt || staff.passwordSetupTokenExpiresAt < now) {
    throw new Error("Ce lien d'activation a expire")
  }

  if (!staff.isActive) {
    throw new Error('Votre compte a ete desactive. Veuillez contacter votre administrateur.')
  }

  const hashedPassword = await hashPassword(data.password)

  const updatedStaff = await prisma.staff.update({
    where: { id: staff.id },
    data: {
      password: hashedPassword,
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true,
          email: true
        }
      }
    }
  })

  const token = generateToken({
    userId: updatedStaff.id,
    email: updatedStaff.email!,
    userType: 'staff',
    salonId: updatedStaff.salonId,
    role: updatedStaff.role
  })

  const { password: _, ...staffWithoutPassword } = updatedStaff

  return {
    user: staffWithoutPassword,
    token,
    userType: 'staff' as const
  }
}
