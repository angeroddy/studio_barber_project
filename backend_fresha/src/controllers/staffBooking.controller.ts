import { Request, Response } from 'express'
import prisma from '../config/database'
import { BookingStatus } from '@prisma/client'

// Récupérer tous les rendez-vous d'un employé
export async function getMyBookings(req: Request, res: Response) {
  try {
    const staffId = req.user?.userId
    const { status, startDate, endDate, limit, offset } = req.query

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    const where: any = {
      OR: [
        { staffId },
        {
          bookingServices: {
            some: {
              staffId
            }
          }
        }
      ]
    }

    // Filtrer par statut
    if (status) {
      where.status = status as BookingStatus
    }

    // Filtrer par période
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } else if (startDate) {
      where.startTime = { gte: new Date(startDate as string) }
    } else if (endDate) {
      where.startTime = { lte: new Date(endDate as string) }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: true,
            color: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                category: true
              }
            },
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined
    })

    const total = await prisma.booking.count({ where })

    res.json({
      success: true,
      count: bookings.length,
      total,
      data: bookings
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des rendez-vous'
    })
  }
}

// Récupérer tous les rendez-vous du salon (pour voir les collègues)
export async function getSalonBookings(req: Request, res: Response) {
  try {
    const staffId = req.user?.userId
    const { status, startDate, endDate, staffIdFilter } = req.query

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    // Récupérer le salon de l'employé
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { salonId: true }
    })

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Employé introuvable'
      })
    }

    const where: any = { salonId: staff.salonId }

    // Filtrer par employé spécifique
    if (staffIdFilter) {
      where.staffId = staffIdFilter as string
    }

    // Filtrer par statut
    if (status) {
      where.status = status as BookingStatus
    }

    // Filtrer par période
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } else if (startDate) {
      where.startTime = { gte: new Date(startDate as string) }
    } else if (endDate) {
      where.startTime = { lte: new Date(endDate as string) }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: true,
            color: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                category: true
              }
            },
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des rendez-vous'
    })
  }
}

// Mettre à jour le statut d'un rendez-vous (employé peut marquer comme IN_PROGRESS, COMPLETED, etc.)
export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body
    const staffId = req.user?.userId

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Statut requis'
      })
    }

    // Vérifier que le rendez-vous appartient à cet employé
    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous introuvable'
      })
    }

    if (booking.staffId !== staffId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce rendez-vous'
      })
    }

    // Mettre à jour le statut
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: true
      }
    })

    res.json({
      success: true,
      message: 'Statut du rendez-vous mis à jour',
      data: updatedBooking
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du rendez-vous'
    })
  }
}

// Ajouter des notes internes à un rendez-vous
export async function addInternalNotes(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { internalNotes } = req.body
    const staffId = req.user?.userId

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    // Vérifier que le rendez-vous appartient à cet employé
    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous introuvable'
      })
    }

    if (booking.staffId !== staffId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce rendez-vous'
      })
    }

    // Mettre à jour les notes internes
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { internalNotes },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: true
      }
    })

    res.json({
      success: true,
      message: 'Notes internes ajoutées',
      data: updatedBooking
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout des notes'
    })
  }
}

// Statistiques des rendez-vous de l'employé
export async function getMyBookingStats(req: Request, res: Response) {
  try {
    const staffId = req.user?.userId
    const { startDate, endDate } = req.query

    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    const where: any = { staffId }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    }

    const [total, completed, pending, canceled, inProgress] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
      prisma.booking.count({ where: { ...where, status: 'CANCELED' } }),
      prisma.booking.count({ where: { ...where, status: 'IN_PROGRESS' } })
    ])

    // Calculer le revenu total (pour les rendez-vous complétés)
    const completedBookings = await prisma.booking.findMany({
      where: { ...where, status: 'COMPLETED' },
      select: { price: true }
    })

    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + Number(booking.price),
      0
    )

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          completed,
          pending,
          canceled,
          inProgress,
          confirmed: total - completed - pending - canceled - inProgress
        },
        totalRevenue
      }
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des statistiques'
    })
  }
}
