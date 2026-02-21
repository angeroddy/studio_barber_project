import prisma from '../config/database'

const MAX_SERIALIZABLE_RETRIES = 3
const SERIALIZABLE_ISOLATION_LEVEL = 'Serializable'

type TransactionClient = any

type TransactionCapableClient = {
  $transaction?: <T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options?: { isolationLevel?: string }
  ) => Promise<T>
}

function hasErrorCode(error: unknown, code: string): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const value = (error as { code?: unknown }).code
  return typeof value === 'string' && value === code
}

function isRetryableSerializableError(error: unknown): boolean {
  if (hasErrorCode(error, 'P2034')) {
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
  operation: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  const prismaClient = prisma as unknown as TransactionCapableClient

  if (typeof prismaClient.$transaction !== 'function') {
    return operation(prisma as unknown as TransactionClient)
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_RETRIES; attempt++) {
    try {
      return await prismaClient.$transaction(operation, {
        isolationLevel: SERIALIZABLE_ISOLATION_LEVEL
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
  tx: TransactionClient,
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
