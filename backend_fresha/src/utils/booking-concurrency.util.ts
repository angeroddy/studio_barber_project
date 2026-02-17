import { Prisma } from '@prisma/client'
import prisma from '../config/database'

const MAX_SERIALIZABLE_RETRIES = 3

function isRetryableSerializableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('could not serialize access') ||
    message.includes('serialization') ||
    message.includes('deadlock detected')
  )
}

export async function withSerializableBookingTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const prismaClient = prisma as unknown as {
    $transaction?: (
      fn: (tx: Prisma.TransactionClient) => Promise<T>,
      options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
    ) => Promise<T>
  }

  if (typeof prismaClient.$transaction !== 'function') {
    return operation(prisma as unknown as Prisma.TransactionClient)
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_RETRIES; attempt++) {
    try {
      return await prismaClient.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      })
    } catch (error) {
      lastError = error

      if (!isRetryableSerializableError(error) || attempt === MAX_SERIALIZABLE_RETRIES) {
        throw error
      }
    }
  }

  throw lastError
}

export async function acquireBookingLocks(
  tx: Prisma.TransactionClient,
  lockKeys: string[]
): Promise<void> {
  const txClient = tx as unknown as { $executeRaw?: unknown }

  if (typeof txClient.$executeRaw !== 'function') {
    return
  }

  const uniqueKeys = Array.from(new Set(lockKeys.filter(Boolean))).sort()

  for (const lockKey of uniqueKeys) {
    await (tx as any).$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext('booking'), hashtext(${lockKey}))
    `
  }
}

export function buildOverlapConditions(startTime: Date, endTime: Date) {
  return [
    {
      AND: [
        { startTime: { lte: startTime } },
        { endTime: { gt: startTime } }
      ]
    },
    {
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gte: endTime } }
      ]
    },
    {
      AND: [
        { startTime: { gte: startTime } },
        { endTime: { lte: endTime } }
      ]
    }
  ]
}
