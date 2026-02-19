import {
  requireOwnerOrManager,
  requireOwnerOrStaff,
  requireUserTypes
} from '../../middlewares/authorization.middleware'

describe('authorization.middleware', () => {
  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any
  }

  it('returns 401 when user is missing', () => {
    const middleware = requireUserTypes('owner')
    const req = {} as any
    const res = createResponse()
    const next = jest.fn()

    middleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Utilisateur non authentifie'
    })
  })

  it('returns 403 when user type is not allowed', () => {
    const middleware = requireUserTypes('owner')
    const req = { user: { userType: 'staff' } } as any
    const res = createResponse()
    const next = jest.fn()

    middleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Acces refuse pour ce type de compte'
    })
  })

  it('calls next when user type is allowed', () => {
    const middleware = requireUserTypes('owner', 'staff')
    const req = { user: { userType: 'staff' } } as any
    const res = createResponse()
    const next = jest.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('allows owner via requireOwnerOrManager', () => {
    const req = { user: { userType: 'owner' } } as any
    const res = createResponse()
    const next = jest.fn()

    requireOwnerOrManager(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('allows manager staff via requireOwnerOrManager', () => {
    const req = { user: { userType: 'staff', role: 'MANAGER' } } as any
    const res = createResponse()
    const next = jest.fn()

    requireOwnerOrManager(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('rejects non-manager staff via requireOwnerOrManager', () => {
    const req = { user: { userType: 'staff', role: 'EMPLOYEE' } } as any
    const res = createResponse()
    const next = jest.fn()

    requireOwnerOrManager(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Acces reserve aux proprietaires et managers'
    })
  })

  it('allows owner or staff and rejects client via requireOwnerOrStaff', () => {
    const res = createResponse()
    const next = jest.fn()

    requireOwnerOrStaff({ user: { userType: 'owner' } } as any, res, next)
    requireOwnerOrStaff({ user: { userType: 'staff' } } as any, res, next)
    requireOwnerOrStaff({ user: { userType: 'client' } } as any, res, next)

    expect(next).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenLastCalledWith(403)
  })
})
