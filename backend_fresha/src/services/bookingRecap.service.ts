import prisma from '../config/database'
import logger from '../config/logger'
import { sendBookingRecapEmail, sendBookingReminder24hEmail } from './email.service'

const DEFAULT_BOOKING_RECAP_DELAY_MINUTES = 2
const DEFAULT_BOOKING_RECAP_POLL_INTERVAL_MS = 30_000
const DEFAULT_BOOKING_REMINDER_LEAD_HOURS = 24
const MAX_BOOKINGS_PER_CYCLE = 50
const workerStartTime = new Date()

let workerStarted = false
let workerRunning = false

const bookingNotificationInclude = {
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
} as const

interface BookingServiceForEmail {
  service: { name: string }
  staff: { firstName: string; lastName: string }
}

interface BookingForEmail {
  id: string
  startTime: Date
  service: { name: string } | null
  staff: { firstName: string; lastName: string } | null
  client: { email: string; firstName: string }
  salon: { name: string; address: string; city: string; phone: string | null; bufferBefore: number }
  bookingServices: BookingServiceForEmail[]
}

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

function getBookingReminderLeadHours(): number {
  const configured = Number(process.env.CLIENT_BOOKING_REMINDER_LEAD_HOURS)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }
  return DEFAULT_BOOKING_REMINDER_LEAD_HOURS
}

function isTemporaryEmail(email: string): boolean {
  return email.endsWith('@temporary.com')
}

function getServiceLabel(booking: Pick<BookingForEmail, 'service' | 'bookingServices'>): string {
  if (booking.bookingServices.length > 0) {
    const uniqueNames = Array.from(
      new Set(booking.bookingServices.map((item: BookingServiceForEmail) => item.service.name).filter(Boolean))
    )
    if (uniqueNames.length > 0) {
      return uniqueNames.join(' + ')
    }
  }
  return booking.service?.name || 'Prestation'
}

function getStaffLabel(booking: Pick<BookingForEmail, 'staff' | 'bookingServices'>): string | undefined {
  if (booking.bookingServices.length > 0) {
    const uniqueNames = Array.from(
      new Set(
        booking.bookingServices
          .map((item: BookingServiceForEmail) => `${item.staff.firstName} ${item.staff.lastName}`.trim())
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

function getSalonAddress(salon: Pick<BookingForEmail['salon'], 'address' | 'city'>): string {
  return [salon.address, salon.city].filter(Boolean).join(', ')
}

function getCustomerStartTime(booking: Pick<BookingForEmail, 'startTime' | 'salon'>): Date {
  return new Date(booking.startTime.getTime() + booking.salon.bufferBefore * 60 * 1000)
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

async function markBookingReminder24hAsSent(bookingId: string): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      reminder24hSent: true,
      reminder24hSentAt: new Date()
    }
  })
}

export async function processPendingBookingRecapEmails(): Promise<number> {
  const delayMinutes = getBookingRecapDelayMinutes()
  const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000)

  const dueBookings: BookingForEmail[] = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      canceledAt: null,
      reminderSent: false,
      createdAt: {
        lte: cutoff,
        gte: workerStartTime
      }
    },
    include: bookingNotificationInclude,
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

    try {
      await sendBookingRecapEmail({
        to: clientEmail,
        firstName: booking.client.firstName,
        salonName: booking.salon.name,
        salonAddress: getSalonAddress(booking.salon),
        salonPhone: booking.salon.phone || undefined,
        serviceLabel: getServiceLabel(booking),
        staffLabel: getStaffLabel(booking),
        bookingStartTime: getCustomerStartTime(booking)
      })

      await markBookingRecapAsSent(booking.id)
      sentCount += 1
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to send booking recap email', {
        bookingId: booking.id,
        email: clientEmail,
        error: errorMessage
      })
    }
  }

  return sentCount
}

export async function processPendingBookingReminder24hEmails(): Promise<number> {
  const leadHours = getBookingReminderLeadHours()
  const now = new Date()
  const cutoff = new Date(now.getTime() + leadHours * 60 * 60 * 1000)

  const dueBookings: BookingForEmail[] = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      canceledAt: null,
      reminder24hSent: false,
      startTime: {
        gt: now,
        lte: cutoff
      }
    },
    include: bookingNotificationInclude,
    orderBy: {
      startTime: 'asc'
    },
    take: MAX_BOOKINGS_PER_CYCLE
  })

  let sentCount = 0

  for (const booking of dueBookings) {
    const clientEmail = booking.client.email.trim().toLowerCase()
    if (!clientEmail.includes('@') || isTemporaryEmail(clientEmail)) {
      logger.warn('Booking reminder 24h skipped due to invalid client email', {
        bookingId: booking.id,
        email: booking.client.email
      })
      await markBookingReminder24hAsSent(booking.id)
      continue
    }

    try {
      await sendBookingReminder24hEmail({
        to: clientEmail,
        firstName: booking.client.firstName,
        salonName: booking.salon.name,
        salonAddress: getSalonAddress(booking.salon),
        salonPhone: booking.salon.phone || undefined,
        serviceLabel: getServiceLabel(booking),
        staffLabel: getStaffLabel(booking),
        bookingStartTime: getCustomerStartTime(booking)
      })

      await markBookingReminder24hAsSent(booking.id)
      sentCount += 1
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to send booking reminder 24h email', {
        bookingId: booking.id,
        email: clientEmail,
        error: errorMessage
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
    logger.warn('Booking email worker disabled: missing RESEND configuration')
    return
  }

  workerStarted = true
  const intervalMs = getBookingRecapPollIntervalMs()
  const delayMinutes = getBookingRecapDelayMinutes()
  const reminderLeadHours = getBookingReminderLeadHours()

  const runCycle = async () => {
    if (workerRunning) {
      return
    }

    workerRunning = true
    try {
      const [recapSentCount, reminderSentCount] = await Promise.all([
        processPendingBookingRecapEmails(),
        processPendingBookingReminder24hEmails()
      ])

      if (recapSentCount > 0) {
        logger.info('Booking recap emails sent', { sentCount: recapSentCount })
      }

      if (reminderSentCount > 0) {
        logger.info('Booking reminder 24h emails sent', { sentCount: reminderSentCount })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Booking email worker cycle failed', { error: errorMessage })
    } finally {
      workerRunning = false
    }
  }

  logger.info('Booking email worker started', {
    recapDelayMinutes: delayMinutes,
    reminderLeadHours,
    pollIntervalMs: intervalMs
  })

  void runCycle()
  const timer = setInterval(() => {
    void runCycle()
  }, intervalMs)
  timer.unref()
}
