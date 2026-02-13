export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function getPaginationParams(
  page: number | undefined,
  limit: number | undefined,
  defaultPage: number = 1,
  defaultLimit: number = 20,
  maxLimit: number = 100
) {
  const validatedPage = Math.max(1, page || defaultPage)
  const validatedLimit = Math.min(maxLimit, Math.max(1, limit || defaultLimit))
  const skip = (validatedPage - 1) * validatedLimit

  return {
    page: validatedPage,
    limit: validatedLimit,
    skip,
    take: validatedLimit,
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}
