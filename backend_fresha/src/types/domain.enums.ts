export const ABSENCE_TYPES = ['VACATION', 'SICK_LEAVE', 'PERSONAL', 'OTHER'] as const
export type AbsenceType = (typeof ABSENCE_TYPES)[number]

export const ABSENCE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type AbsenceStatus = (typeof ABSENCE_STATUSES)[number]

export const BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW'
] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const STAFF_ROLES = ['MANAGER', 'EMPLOYEE'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]
