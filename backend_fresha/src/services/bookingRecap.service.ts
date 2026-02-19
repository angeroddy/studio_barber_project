import prisma from '../config/database'
import logger from '../config/logger'
import { sendBookingRecapEmail } from './email.service'

const DEFAULT_BOOKING_RECAP_DELAY_MINUTES = 2
const DEFAULT_BOOKING_RECAP_POLL_INTERVAL_MS = 30_000
const MAX_BOOKINGS_PER_CYCLE = 50
const workerStartTime = new Date()

let workerStarted = false
let workerRunning = false

function getBookingRecapDelayMinutes(): number {
  const configured = Number(process.env.CLIENT_BOOKING_RECAP_DELAY_MINUTES)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }
  return DEFAULT_BOOKING_RECAP_DELAY_MINUTES
}

function getBookingRecapPollIntervalMs(): number {
  const configured = Number(process.env.CLIENT_BOOKING_RECAP_POLL_INTERVAL_MS)
  if (Number.isFinite(configured) && configured >= 5_000) {
    return configured
  }
  return DEFAULT_BOOKING_RECAP_POLL_INTERVAL_MS
}

function isTemporaryEmail(email: string): boolean {
  return email.endsWith('@temporary.com')
}

function getServiceLabel(booking: {
  service: { name: string } | null
  bookingServices: Array<{ service: { name: string } }>
}): string {
  if (booking.bookingServices.length > 0) {
    const uniqueNames = Array.from(new Set(booking.bookingServices.map((item) => item.service.name).filter(Boolean)))
    if (uniqueNames.length > 0) {
      return uniqueNames.join(' + ')
    }
  }
  return booking.service?.name || 'Prestation'
}

function getStaffLabel(booking: {
  staff: { firstName: string; lastName: string } | null
  bookingServices: Array<{ staff: { firstName: string; lastName: string } }>
}): string | undefined {
  if (booking.bookingServices.length > 0) {
    const uniqueNames = Array.from(
      new Set(
        booking.bookingServices
          .map((item) => `${item.staff.firstName} ${item.staff.lastName}`.trim())
          .filter(Boolean)
      )
    )
    if (uniqueNames.length > 0) {
      return uniqueNames.join(' / ')
    }
  }

  if (booking.staff) {
    return `${booking.staff.firstName} ${booking.staff.lastName}`.trim()
  }

  return undefined
}

function getSalonAddress(salon: { address: string; city: string }): string {
  return [salon.address, salon.city].filter(Boolean).join(', ')
}

async function markBookingRecapAsSent(bookingId: string): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      reminderSent: true,
      reminderSentAt: new Date()
    }
  })
}

export async function processPendingBookingRecapEmails(): Promise<number> {
  const delayMinutes = getBookingRecapDelayMinutes()
  const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000)

  const dueBookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      canceledAt: null,
      reminderSent: false,
      createdAt: {
        lte: cutoff,
        gte: workerStartTime
      }
    },
    include: {
      client: {
        select: {
          email: true,
          firstName: true
        }
      },
      salon: {
        select: {
          name: true,
          address: true,
          city: true,
          phone: true,
          bufferBefore: true
        }
      },
      service: {
        select: {
          name: true
        }
      },
      staff: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      bookingServices: {
        include: {
          service: {
            select: {
              name: true
            }
          },
          staff: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: MAX_BOOKINGS_PER_CYCLE
  })

  let sentCount = 0
  for (const booking of dueBookings) {
    const clientEmail = booking.client.email.trim().toLowerCase()
    if (!clientEmail.includes('@') || isTemporaryEmail(clientEmail)) {
      logger.warn('Recap booking email skipped due to invalid client email', {
        bookingId: booking.id,
        email: booking.client.email
      })
      await markBookingRecapAsSent(booking.id)
      continue
    }

    const customerStartTime = new Date(booking.startTime.getTime() + booking.salon.bufferBefore * 60 * 1000)

    try {
      await sendBookingRecapEmail({
        to: clientEmail,
        firstName: booking.client.firstName,
        salonName: booking.salon.name,
        salonAddress: getSalonAddress(booking.salon),
        salonPhone: booking.salon.phone || undefined,
        serviceLabel: getServiceLabel(booking),
        staffLabel: getStaffLabel(booking),
        bookingStartTime: customerStartTime
      })

      await markBookingRecapAsSent(booking.id)
      sentCount += 1
    } catch (error: any) {
      logger.error('Failed to send booking recap email', {
        bookingId: booking.id,
        email: clientEmail,
        error: error?.message
      })
    }
  }

  return sentCount
}

export function startBookingRecapWorker(): void {
  if (workerStarted) {
    return
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    logger.warn('Booking recap worker disabled: missing RESEND configuration')
    return
  }

  workerStarted = true
  const intervalMs = getBookingRecapPollIntervalMs()
  const delayMinutes = getBookingRecapDelayMinutes()

  const runCycle = async () => {
    if (workerRunning) {
      return
    }

    workerRunning = true
    try {
      const sentCount = await processPendingBookingRecapEmails()
      if (sentCount > 0) {
        logger.info('Booking recap emails sent', { sentCount })
      }
    } catch (error: any) {
      logger.error('Booking recap worker cycle failed', { error: error?.message })
    } finally {
      workerRunning = false
    }
  }

  logger.info('Booking recap worker started', {
    delayMinutes,
    pollIntervalMs: intervalMs
  })

  void runCycle()
  const timer = setInterval(() => {
    void runCycle()
  }, intervalMs)
  timer.unref()
}
