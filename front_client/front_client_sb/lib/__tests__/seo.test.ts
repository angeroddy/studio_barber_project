import { absoluteUrl, getMetadataBase, getSiteUrl } from '../seo'

describe('lib/seo', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const originalVercelUrl = process.env.VERCEL_URL

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_URL
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    process.env.VERCEL_URL = originalVercelUrl
  })

  it('prefers NEXT_PUBLIC_SITE_URL and strips quotes and trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '"https://studiobarber.fr/"'
    process.env.VERCEL_URL = 'preview.vercel.app'

    expect(getSiteUrl()).toBe('https://studiobarber.fr')
  })

  it('falls back to VERCEL_URL and adds https when protocol is missing', () => {
    process.env.VERCEL_URL = 'studio-barber-preview.vercel.app'

    expect(getSiteUrl()).toBe('https://studio-barber-preview.vercel.app')
  })

  it('uses http for localhost-like hosts', () => {
    process.env.VERCEL_URL = 'localhost:3005'

    expect(getSiteUrl()).toBe('http://localhost:3005')
  })

  it('falls back to localhost when no environment variable is provided', () => {
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('builds absolute URLs from relative paths', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://studiobarber.fr'

    expect(absoluteUrl('reserver')).toBe('https://studiobarber.fr/reserver')
    expect(absoluteUrl('/mentions-legales')).toBe('https://studiobarber.fr/mentions-legales')
    expect(getMetadataBase().toString()).toBe('https://studiobarber.fr/')
  })
})
