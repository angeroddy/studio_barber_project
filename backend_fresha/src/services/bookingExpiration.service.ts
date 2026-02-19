import prisma from '../config/database'

const SLOT_HOLD_MINUTES = 10

export function getSlotHoldMinutes(): number {
  const configured = Number(process.env.CLIENT_SLOT_HOLD_MINUTES)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }
  return SLOT_HOLD_MINUTES
}

export async function expireUnverifiedPendingBookings(): Promise<number> {
  const holdMinutes = getSlotHoldMinutes()
  const cutoffDate = new Date(Date.now() - holdMinutes * 60 * 1000)
  const now = new Date()

  const result = await prisma.booking.updateMany({
    where: {
      status: 'PENDING',
      canceledAt: null,
      createdAt: {
        lte: cutoffDate
      },
      client: {
        is: {
          emailVerificationRequired: true,
          emailVerifiedAt: null
        }
      }
    },
    data: {
      status: 'CANCELED',
      canceledAt: now
    }
  })

  return result.count
}
