import { comparePassword, hashPassword } from '../../utils/hash.util'

describe('hash.util', () => {
  it('hashes a password and verifies it successfully', async () => {
    const plainPassword = 'StrongPass123!@#'
    const hash = await hashPassword(plainPassword)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(plainPassword)

    await expect(comparePassword(plainPassword, hash)).resolves.toBe(true)
  })

  it('returns false when comparing a wrong password', async () => {
    const hash = await hashPassword('CorrectPassword123!')

    await expect(comparePassword('WrongPassword456!', hash)).resolves.toBe(false)
  })
})
