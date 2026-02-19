import { createPaginatedResponse, getPaginationParams } from '../../utils/pagination.util'

describe('pagination.util', () => {
  it('returns validated pagination params with defaults', () => {
    const params = getPaginationParams(undefined, undefined)

    expect(params).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
      take: 20
    })
  })

  it('clamps invalid page and limit values', () => {
    const params = getPaginationParams(-10, 1000, 1, 20, 100)

    expect(params).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
      take: 100
    })
  })

  it('computes skip correctly for paged queries', () => {
    const params = getPaginationParams(3, 15)

    expect(params.skip).toBe(30)
    expect(params.take).toBe(15)
  })

  it('creates paginated response with total pages', () => {
    const data = [{ id: 'a' }, { id: 'b' }]
    const result = createPaginatedResponse(data, 45, 2, 20)

    expect(result).toEqual({
      data,
      pagination: {
        total: 45,
        page: 2,
        limit: 20,
        totalPages: 3
      }
    })
  })
})
