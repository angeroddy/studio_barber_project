import prisma from '../config/database'

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as const
const SLOT_STEP_MINUTES = 20
const DEFAULT_BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'Europe/Paris'

type DbClient = any

type TimeRange = {
  startMinutes: number
  endMinutes: number
}

type AvailabilityContext = {
  salon: {
    id: string
    bufferBefore: number
    bufferAfter: number
    processingTime: number
  }
  service: {
    id: string
    duration: number
    salonId: string
    price?: unknown
  }
  dateKey: string
  dayOfWeek: number
  salonSchedule: {
    isClosed: boolean
    timeSlots: Array<{ startTime: string; endTime: string }>
  } | null
  staffMembers: Array<{
    id: string
    salonId: string
    isActive: boolean
    schedules: Array<{
      startTime: string
      endTime: string
      isAvailable: boolean
    }>
  }>
  bookingsByStaffId: Map<string, TimeRange[]>
  staffIdsOnAbsence: Set<string>
  closed: boolean
}

type AvailableSlotOption = {
  time: string
  staffId: string
  staffIds: string[]
}

type ResolveSlotParams = {
  salonId: string
  staffId: string
  serviceId: string
  visibleStartTime: Date | string
  customDuration?: number
  db?: DbClient
}

type ValidateIntervalParams = {
  salonId: string
  staffId: string
  startTime: Date
  endTime: Date
  db?: DbClient
}

type StaffConflict = {
  bookings: any[]
  bookingServices: any[]
  absence?: {
    type: string
    startDate: Date
    endDate: Date
    reason?: string | null
  }
}

const businessDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_BUSINESS_TIMEZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short'
})

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
}

function getBusinessParts(date: Date) {
  const parts = businessDateTimeFormatter.formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as Record<string, string>

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday: weekdayMap[values.weekday] ?? 0
  }
}

function toDateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year.toString().padStart(4, '0')}-${parts.month
    .toString()
    .padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`
}

function getBusinessDateKey(date: Date) {
  return toDateKey(getBusinessParts(date))
}

function getBusinessMinutes(date: Date) {
  const parts = getBusinessParts(date)
  return parts.hour * 60 + parts.minute
}

function parseDateInput(date: Date | string): string {
  if (date instanceof Date) {
    return getBusinessDateKey(date)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  return getBusinessDateKey(new Date(date))
}

function getDayOfWeekFromDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`).getUTCDay()
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function ceilToStep(value: number, step: number) {
  return Math.ceil(value / step) * step
}

function overlaps(a: TimeRange, b: TimeRange) {
  return a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes
}

function mergeRanges(ranges: TimeRange[]) {
  if (ranges.length === 0) {
    return []
  }

  const sorted = [...ranges].sort((a, b) => a.startMinutes - b.startMinutes)
  const merged: TimeRange[] = [sorted[0]]

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]
    const previous = merged[merged.length - 1]

    if (current.startMinutes <= previous.endMinutes) {
      previous.endMinutes = Math.max(previous.endMinutes, current.endMinutes)
      continue
    }

    merged.push({ ...current })
  }

  return merged
}

function getRangeForDateKey(startTime: Date, endTime: Date, dateKey: string): TimeRange | null {
  const startKey = getBusinessDateKey(startTime)
  const endKey = getBusinessDateKey(endTime)

  if (dateKey < startKey || dateKey > endKey) {
    return null
  }

  const startMinutes = startKey === dateKey ? getBusinessMinutes(startTime) : 0
  const endMinutes = endKey === dateKey ? getBusinessMinutes(endTime) : 24 * 60

  if (endMinutes <= startMinutes) {
    return null
  }

  return { startMinutes, endMinutes }
}

function buildWorkingRanges(
  salonSchedule: AvailabilityContext['salonSchedule'],
  staffSchedules: AvailabilityContext['staffMembers'][number]['schedules']
) {
  if (!salonSchedule || salonSchedule.isClosed) {
    return []
  }

  const ranges: TimeRange[] = []

  for (const salonTimeSlot of salonSchedule.timeSlots) {
    const salonRange = {
      startMinutes: timeToMinutes(salonTimeSlot.startTime),
      endMinutes: timeToMinutes(salonTimeSlot.endTime)
    }

    for (const staffSchedule of staffSchedules) {
      if (staffSchedule.isAvailable === false) {
        continue
      }

      const startMinutes = Math.max(salonRange.startMinutes, timeToMinutes(staffSchedule.startTime))
      const endMinutes = Math.min(salonRange.endMinutes, timeToMinutes(staffSchedule.endTime))

      if (endMinutes > startMinutes) {
        ranges.push({ startMinutes, endMinutes })
      }
    }
  }

  return mergeRanges(ranges)
}

async function getClosedDay(db: DbClient, salonId: string, dateKey: string) {
  const startOfDayUtc = new Date(`${dateKey}T00:00:00.000Z`)
  const endOfDayUtc = new Date(`${dateKey}T23:59:59.999Z`)

  return db.closedDay.findFirst({
    where: {
      salonId,
      date: {
        gte: startOfDayUtc,
        lte: endOfDayUtc
      }
    }
  })
}

async function loadAvailabilityContext(
  db: DbClient,
  params: {
    salonId: string
    staffId: string
    serviceId: string
    date: Date | string
    customDuration?: number
  }
) {
  const dateKey = parseDateInput(params.date)
  const dayOfWeek = getDayOfWeekFromDateKey(dateKey)

  const [service, salon, closedDay, salonSchedule] = await Promise.all([
    db.service.findUnique({
      where: { id: params.serviceId },
      select: {
        id: true,
        duration: true,
        salonId: true,
        price: true,
        isActive: true
      }
    }),
    db.salon.findUnique({
      where: { id: params.salonId },
      select: {
        id: true,
        bufferBefore: true,
        bufferAfter: true,
        processingTime: true
      }
    }),
    getClosedDay(db, params.salonId, dateKey),
    db.schedule.findFirst({
      where: {
        salonId: params.salonId,
        dayOfWeek
      },
      include: {
        timeSlots: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })
  ])

  if (!service || service.salonId !== params.salonId || service.isActive === false) {
    throw new Error('Service introuvable')
  }

  if (!salon) {
    throw new Error('Salon introuvable')
  }

  const staffWhere =
    params.staffId === 'any'
      ? {
          salonId: params.salonId,
          isActive: true
        }
      : {
          id: params.staffId,
          salonId: params.salonId,
          isActive: true
        }

  const staffMembers = await db.staff.findMany({
    where: staffWhere,
    include: {
      schedules: {
        where: {
          dayOfWeek,
          isAvailable: true
        }
      }
    }
  })

  const staffIds = staffMembers.map((staff: { id: string }) => staff.id)
  if (params.staffId !== 'any' && staffIds.length === 0) {
    throw new Error('Membre du personnel introuvable')
  }

  if (staffIds.length === 0) {
    return {
      context: {
        salon,
        service,
        dateKey,
        dayOfWeek,
        salonSchedule,
        staffMembers: [],
        bookingsByStaffId: new Map<string, TimeRange[]>(),
        staffIdsOnAbsence: new Set<string>(),
        closed: Boolean(closedDay) || !salonSchedule || salonSchedule.isClosed
      } satisfies AvailabilityContext,
      baseDuration: params.customDuration || service.duration,
      effectiveDuration:
        salon.bufferBefore +
        (params.customDuration || service.duration) +
        salon.processingTime +
        salon.bufferAfter
    }
  }

  const approvedAbsences = await db.absence.findMany({
    where: {
      staffId: {
        in: staffIds
      },
      status: 'APPROVED'
    }
  })

  const staffIdsOnAbsence = new Set<string>(
    approvedAbsences
      .filter((absence: { startDate: Date; endDate: Date }) => {
        const startKey = absence.startDate.toISOString().slice(0, 10)
        const endKey = absence.endDate.toISOString().slice(0, 10)
        return startKey <= dateKey && endKey >= dateKey
      })
      .map((absence: { staffId: string }) => absence.staffId)
  )

  const rangeStart = new Date(`${dateKey}T00:00:00.000Z`)
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1)

  const rangeEnd = new Date(`${dateKey}T00:00:00.000Z`)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 2)

  const [bookings, bookingServices] = await Promise.all([
    db.booking.findMany({
      where: {
        staffId: {
          in: staffIds
        },
        status: {
          in: [...ACTIVE_BOOKING_STATUSES]
        },
        startTime: {
          lt: rangeEnd
        },
        endTime: {
          gt: rangeStart
        }
      }
    }),
    db.bookingService.findMany({
      where: {
        staffId: {
          in: staffIds
        },
        startTime: {
          lt: rangeEnd
        },
        endTime: {
          gt: rangeStart
        },
        booking: {
          status: {
            in: [...ACTIVE_BOOKING_STATUSES]
          }
        }
      },
      include: {
        booking: {
          select: {
            status: true
          }
        }
      }
    })
  ])

  const bookingsByStaffId = new Map<string, TimeRange[]>()

  for (const booking of bookings) {
    if (!booking.staffId) {
      continue
    }

    const range = getRangeForDateKey(new Date(booking.startTime), new Date(booking.endTime), dateKey)
    if (!range) {
      continue
    }

    const existing = bookingsByStaffId.get(booking.staffId) || []
    existing.push(range)
    bookingsByStaffId.set(booking.staffId, existing)
  }

  for (const bookingService of bookingServices) {
    const range = getRangeForDateKey(
      new Date(bookingService.startTime),
      new Date(bookingService.endTime),
      dateKey
    )
    if (!range) {
      continue
    }

    const existing = bookingsByStaffId.get(bookingService.staffId) || []
    existing.push(range)
    bookingsByStaffId.set(bookingService.staffId, existing)
  }

  for (const [staffId, ranges] of bookingsByStaffId.entries()) {
    bookingsByStaffId.set(staffId, mergeRanges(ranges))
  }

  return {
    context: {
      salon,
      service,
      dateKey,
      dayOfWeek,
      salonSchedule,
      staffMembers,
      bookingsByStaffId,
      staffIdsOnAbsence,
      closed: Boolean(closedDay) || !salonSchedule || salonSchedule.isClosed
    } satisfies AvailabilityContext,
    baseDuration: params.customDuration || service.duration,
    effectiveDuration:
      salon.bufferBefore +
      (params.customDuration || service.duration) +
      salon.processingTime +
      salon.bufferAfter
  }
}

export async function getAvailableSlotOptions(
  params: {
    salonId: string
    staffId: string
    serviceId: string
    date: Date | string
    customDuration?: number
    db?: DbClient
  }
): Promise<AvailableSlotOption[]> {
  const db = params.db || prisma
  const { context, effectiveDuration } = await loadAvailabilityContext(db, params)

  if (context.closed || !context.salonSchedule) {
    return []
  }

  const slotsByTime = new Map<string, Set<string>>()

  for (const staff of context.staffMembers) {
    if (context.staffIdsOnAbsence.has(staff.id)) {
      continue
    }

    const workingRanges = buildWorkingRanges(context.salonSchedule, staff.schedules)
    const occupiedRanges = context.bookingsByStaffId.get(staff.id) || []

    for (const workingRange of workingRanges) {
      const firstVisibleStart = ceilToStep(
        workingRange.startMinutes + context.salon.bufferBefore,
        SLOT_STEP_MINUTES
      )

      for (
        let visibleStartMinutes = firstVisibleStart;
        visibleStartMinutes < workingRange.endMinutes;
        visibleStartMinutes += SLOT_STEP_MINUTES
      ) {
        const blockedStartMinutes = visibleStartMinutes - context.salon.bufferBefore
        const blockedEndMinutes = blockedStartMinutes + effectiveDuration

        if (blockedStartMinutes < workingRange.startMinutes) {
          continue
        }

        if (blockedEndMinutes > workingRange.endMinutes) {
          break
        }

        const requestedRange = {
          startMinutes: blockedStartMinutes,
          endMinutes: blockedEndMinutes
        }

        const hasConflict = occupiedRanges.some((range) => overlaps(range, requestedRange))
        if (hasConflict) {
          continue
        }

        const visibleTime = minutesToTime(visibleStartMinutes)
        const staffIds = slotsByTime.get(visibleTime) || new Set<string>()
        staffIds.add(staff.id)
        slotsByTime.set(visibleTime, staffIds)
      }
    }
  }

  return Array.from(slotsByTime.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([time, staffIds]) => {
      const sortedStaffIds = Array.from(staffIds).sort()
      return {
        time,
        staffId: sortedStaffIds[0],
        staffIds: sortedStaffIds
      }
    })
}

export async function getAvailableSlotTimes(
  params: {
    salonId: string
    staffId: string
    serviceId: string
    date: Date | string
    customDuration?: number
    db?: DbClient
  }
) {
  const options = await getAvailableSlotOptions(params)
  return options.map((option) => option.time)
}

export async function resolveAvailableStaffForVisibleStart(
  params: ResolveSlotParams
) {
  const options = await getAvailableSlotOptions({
    salonId: params.salonId,
    staffId: params.staffId,
    serviceId: params.serviceId,
    date: params.visibleStartTime,
    customDuration: params.customDuration,
    db: params.db
  })

  const requestedTime = minutesToTime(getBusinessMinutes(new Date(params.visibleStartTime)))
  const match = options.find((option) => option.time === requestedTime)

  if (!match) {
    throw new Error("Ce créneau n'est plus disponible")
  }

  if (params.staffId !== 'any' && !match.staffIds.includes(params.staffId)) {
    throw new Error("Ce créneau n'est pas disponible pour ce professionnel")
  }

  return params.staffId === 'any' ? match.staffId : params.staffId
}

async function getApprovedAbsenceForInterval(
  db: DbClient,
  staffId: string,
  startTime: Date,
  endTime: Date
) {
  const startKey = getBusinessDateKey(startTime)
  const endKey = getBusinessDateKey(endTime)

  const absences = await db.absence.findMany({
    where: {
      staffId,
      status: 'APPROVED'
    }
  })

  return absences.find((absence: { startDate: Date; endDate: Date }) => {
    const absenceStartKey = absence.startDate.toISOString().slice(0, 10)
    const absenceEndKey = absence.endDate.toISOString().slice(0, 10)
    return absenceStartKey <= endKey && absenceEndKey >= startKey
  })
}

export async function findStaffConflictsForInterval(
  params: {
    staffId: string
    startTime: Date
    endTime: Date
    excludeBookingId?: string
    db?: DbClient
  }
): Promise<StaffConflict> {
  const db = params.db || prisma

  const bookingWhere: any = {
    staffId: params.staffId,
    status: {
      in: [...ACTIVE_BOOKING_STATUSES]
    },
    startTime: {
      lt: params.endTime
    },
    endTime: {
      gt: params.startTime
    }
  }

  if (params.excludeBookingId) {
    bookingWhere.id = { not: params.excludeBookingId }
  }

  const bookingServiceWhere: any = {
    staffId: params.staffId,
    startTime: {
      lt: params.endTime
    },
    endTime: {
      gt: params.startTime
    },
    booking: {
      status: {
        in: [...ACTIVE_BOOKING_STATUSES]
      }
    }
  }

  if (params.excludeBookingId) {
    bookingServiceWhere.bookingId = { not: params.excludeBookingId }
  }

  const [bookings, bookingServices, absence] = await Promise.all([
    db.booking.findMany({
      where: bookingWhere,
      include: {
        service: {
          select: {
            name: true
          }
        }
      }
    }),
    db.bookingService.findMany({
      where: bookingServiceWhere,
      include: {
        booking: {
          select: {
            id: true,
            status: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    }),
    getApprovedAbsenceForInterval(db, params.staffId, params.startTime, params.endTime)
  ])

  return {
    bookings,
    bookingServices,
    absence: absence
      ? {
          type: absence.type,
          startDate: absence.startDate,
          endDate: absence.endDate,
          reason: absence.reason
        }
      : undefined
  }
}

export async function validateStaffIntervalConstraints(
  params: ValidateIntervalParams
) {
  const db = params.db || prisma
  const dateKey = getBusinessDateKey(params.startTime)

  if (getBusinessDateKey(params.endTime) !== dateKey) {
    throw new Error("Le créneau doit être contenu dans une seule journée d'ouverture")
  }

  const dayOfWeek = getDayOfWeekFromDateKey(dateKey)
  const [closedDay, salonSchedule, staff] = await Promise.all([
    getClosedDay(db, params.salonId, dateKey),
    db.schedule.findFirst({
      where: {
        salonId: params.salonId,
        dayOfWeek
      },
      include: {
        timeSlots: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    }),
    db.staff.findUnique({
      where: {
        id: params.staffId
      },
      include: {
        schedules: {
          where: {
            dayOfWeek,
            isAvailable: true
          }
        }
      }
    })
  ])

  if (closedDay || !salonSchedule || salonSchedule.isClosed) {
    throw new Error('Le salon est fermé sur ce créneau')
  }

  if (!staff || staff.salonId !== params.salonId || staff.isActive === false) {
    throw new Error('Membre du personnel introuvable')
  }

  const absence = await getApprovedAbsenceForInterval(db, params.staffId, params.startTime, params.endTime)
  if (absence) {
    throw new Error('Ce professionnel est absent sur ce créneau')
  }

  const requestedRange = getRangeForDateKey(params.startTime, params.endTime, dateKey)
  if (!requestedRange) {
    throw new Error('Créneau invalide')
  }

  const workingRanges = buildWorkingRanges(salonSchedule, staff.schedules)
  const fitsWorkingHours = workingRanges.some(
    (range) =>
      requestedRange.startMinutes >= range.startMinutes &&
      requestedRange.endMinutes <= range.endMinutes
  )

  if (!fitsWorkingHours) {
    throw new Error("Le créneau est en dehors des horaires d'ouverture ou du planning du professionnel")
  }
}

export {
  ACTIVE_BOOKING_STATUSES,
  DEFAULT_BUSINESS_TIMEZONE,
  SLOT_STEP_MINUTES,
  getBusinessDateKey,
  getBusinessMinutes,
  minutesToTime
}
