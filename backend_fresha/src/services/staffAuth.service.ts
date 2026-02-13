import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash.util'
import { generateToken } from '../utils/jwt.util'

interface StaffLoginData {
  email: string
  password: string
}

interface StaffUpdatePasswordData {
  staffId: string
  currentPassword: string
  newPassword: string
}

export async function staffLogin(data: StaffLoginData) {
  // 1. Trouver le staff par email avec son salon
  const staff = await prisma.staff.findUnique({
    where: { email: data.email },
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

  // 2. Vérifier que le staff a un mot de passe configuré
  if (!staff.password) {
    throw new Error('Aucun mot de passe configuré pour ce compte. Veuillez contacter votre administrateur.')
  }

  // 3. Vérifier que le staff est actif
  if (!staff.isActive) {
    throw new Error('Votre compte a été désactivé. Veuillez contacter votre administrateur.')
  }

  // 4. Vérifier le mot de passe
  const isPasswordValid = await comparePassword(data.password, staff.password)

  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect')
  }

  // 5. Générer le token JWT avec un payload spécifique pour le staff
  const token = generateToken({
    userId: staff.id,
    email: staff.email!,
    userType: 'staff', // Identifier le type d'utilisateur
    salonId: staff.salonId,
    role: staff.role
  })

  // 6. Retourner le staff (sans le password) et le token
  const { password, ...staffWithoutPassword } = staff

  return {
    user: staffWithoutPassword,
    token,
    userType: 'staff'
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
    throw new Error('Employé introuvable')
  }

  if (!staff.isActive) {
    throw new Error('Votre compte a été désactivé')
  }

  return staff
}

export async function updateStaffPassword(data: StaffUpdatePasswordData) {
  const { staffId, currentPassword, newPassword } = data

  // 1. Récupérer le staff
  const staff = await prisma.staff.findUnique({
    where: { id: staffId }
  })

  if (!staff) {
    throw new Error('Employé introuvable')
  }

  // 2. Vérifier que le staff a un mot de passe actuel
  if (!staff.password) {
    // Si pas de mot de passe actuel, on permet de créer un nouveau
    const hashedPassword = await hashPassword(newPassword)

    await prisma.staff.update({
      where: { id: staffId },
      data: { password: hashedPassword }
    })

    return { message: 'Mot de passe créé avec succès' }
  }

  // 3. Vérifier l'ancien mot de passe
  const isPasswordValid = await comparePassword(currentPassword, staff.password)

  if (!isPasswordValid) {
    throw new Error('Mot de passe actuel incorrect')
  }

  // 4. Hasher et mettre à jour le nouveau mot de passe
  const hashedPassword = await hashPassword(newPassword)

  await prisma.staff.update({
    where: { id: staffId },
    data: { password: hashedPassword }
  })

  return { message: 'Mot de passe mis à jour avec succès' }
}

export async function initializeStaffPassword(staffId: string, password: string, salonId?: string) {
  // Cette fonction est appelée par un Owner/Manager pour initialiser le mot de passe d'un staff

  // 1. Vérifier que le staff existe
  const staff = await prisma.staff.findUnique({
    where: { id: staffId }
  })

  if (!staff) {
    throw new Error('Employé introuvable')
  }

  // 2. Vérifier l'ownership si salonId est fourni
  if (salonId && staff.salonId !== salonId) {
    throw new Error('Non autorisé à modifier cet employé')
  }

  // 3. Hasher et mettre à jour le mot de passe
  const hashedPassword = await hashPassword(password)

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      password: hashedPassword,
      // Si l'email n'est pas défini, on ne peut pas activer l'authentification
      email: staff.email || undefined
    }
  })

  return { message: 'Mot de passe initialisé avec succès' }
}

export async function firstLoginSetPassword(email: string, password: string) {
  // Cette fonction est appelée par l'employé lui-même lors de sa première connexion

  // 1. Vérifier que le staff existe avec cet email
  const staff = await prisma.staff.findUnique({
    where: { email }
  })

  if (!staff) {
    throw new Error('Aucun compte employé trouvé avec cet email')
  }

  // 2. Vérifier que le staff n'a pas encore de mot de passe (première connexion)
  if (staff.password) {
    throw new Error('Ce compte a déjà un mot de passe. Utilisez la connexion normale.')
  }

  // 3. Vérifier que le compte est actif
  if (!staff.isActive) {
    throw new Error('Votre compte a été désactivé. Veuillez contacter votre administrateur.')
  }

  // 4. Hasher et enregistrer le nouveau mot de passe
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

  // 5. Générer le token JWT
  const token = generateToken({
    userId: updatedStaff.id,
    email: updatedStaff.email!,
    userType: 'staff',
    salonId: updatedStaff.salonId,
    role: updatedStaff.role
  })

  // 6. Retourner l'utilisateur et le token (connexion automatique après création du mot de passe)
  const { password: _, ...staffWithoutPassword } = updatedStaff

  return {
    user: staffWithoutPassword,
    token,
    userType: 'staff' as const
  }
}
