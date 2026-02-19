import { Prisma } from '@prisma/client'
import prisma from '../../config/database'
import {
  acquireBookingLocks,
  buildOverlapConditions,
  withSerializableBookingTransaction
} from '../../utils/booking-concurrency.util'

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn()
  }
}))

describe('booking-concurrency.util', () => {
  const mockedPrisma = prisma as unknown as {
    $transaction?: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('withSerializableBookingTransaction', () => {
    it('uses serializable isolation when transaction API is available', async () => {
      mockedPrisma.$transaction = jest.fn().mockResolvedValue('ok')
      const operation = jest.fn()

      const result = await withSerializableBookingTransaction(operation)

      expect(result).toBe('ok')
      expect(mockedPrisma.$transaction).toHaveBeenCalledWith(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      })
    })

    it('retries retryable serialization errors', async () => {
      mockedPrisma.$transaction = jest
        .fn()
        .mockRejectedValueOnce(new Error('could not serialize access due to concurrent update'))
        .mockResolvedValueOnce('retried-ok')

      const result = await withSerializableBookingTransaction(jest.fn())

      expect(result).toBe('retried-ok')
      expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(2)
    })

    it('throws immediately on non-retryable errors', async () => {
      const fatalError = new Error('permission denied')
      mockedPrisma.$transaction = jest.fn().mockRejectedValue(fatalError)

      await expect(withSerializableBookingTransaction(jest.fn())).rejects.toThrow('permission denied')
      expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('throws after max retries for serialization errors', async () => {
      mockedPrisma.$transaction = jest.fn().mockRejectedValue(new Error('serialization failure'))

      await expect(withSerializableBookingTransaction(jest.fn())).rejects.toThrow('serialization')
      expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(3)
    })

    it('falls back to direct operation when transaction API is unavailable', async () => {
      const originalTransaction = mockedPrisma.$transaction
      delete mockedPrisma.$transaction

      const operation = jest.fn().mockResolvedValue('fallback-ok')

      try {
        const result = await withSerializableBookingTransaction(operation)
        expect(result).toBe('fallback-ok')
        expect(operation).toHaveBeenCalledWith(prisma)
      } finally {
        mockedPrisma.$transaction = originalTransaction
      }
    })
  })

  describe('acquireBookingLocks', () => {
    it('acquires advisory locks in deterministic sorted order without duplicates', async () => {
      const executeRaw = jest.fn().mockResolvedValue(undefined)
      const tx = { $executeRaw: executeRaw } as any

      await acquireBookingLocks(tx, ['staff-b', 'staff-a', 'staff-b', '', 'staff-c'])

      expect(executeRaw).toHaveBeenCalledTimes(3)
      expect(executeRaw.mock.calls[0][1]).toBe('staff-a')
      expect(executeRaw.mock.calls[1][1]).toBe('staff-b')
      expect(executeRaw.mock.calls[2][1]).toBe('staff-c')
    })

    it('does nothing when transaction client does not support executeRaw', async () => {
      await expect(acquireBookingLocks({} as any, ['staff-a'])).resolves.toBeUndefined()
    })
  })

  describe('buildOverlapConditions', () => {
    it('returns expected overlap OR conditions', () => {
      const startTime = new Date('2026-02-19T10:00:00.000Z')
      const endTime = new Date('2026-02-19T11:00:00.000Z')

      const result = buildOverlapConditions(startTime, endTime)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        AND: [
          { startTime: { lte: startTime } },
          { endTime: { gt: startTime } }
        ]
      })
      expect(result[1]).toEqual({
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gte: endTime } }
        ]
      })
      expect(result[2]).toEqual({
        AND: [
          { startTime: { gte: startTime } },
          { endTime: { lte: endTime } }
        ]
      })
    })
  })
})
