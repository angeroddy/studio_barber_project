import { apiRequest } from './config';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const resolvedSalonIdCache = new Map<string, string>();
const inFlightSalonIdResolutions = new Map<string, Promise<string>>();

export async function resolveSalonId(salonIdentifier: string): Promise<string> {
  if (!salonIdentifier || UUID_REGEX.test(salonIdentifier)) {
    return salonIdentifier;
  }

  if (resolvedSalonIdCache.has(salonIdentifier)) {
    return resolvedSalonIdCache.get(salonIdentifier)!;
  }

  const inFlightResolution = inFlightSalonIdResolutions.get(salonIdentifier);
  if (inFlightResolution) {
    return inFlightResolution;
  }

  const resolvePromise = (async (): Promise<string> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        data?: { id: string };
      }>(`/salons/slug/${encodeURIComponent(salonIdentifier)}`);

      const resolvedSalonId = response.data?.id || salonIdentifier;
      resolvedSalonIdCache.set(salonIdentifier, resolvedSalonId);
      return resolvedSalonId;
    } catch {
      // Cache fallback to avoid repeating failing slug lookups.
      resolvedSalonIdCache.set(salonIdentifier, salonIdentifier);
      return salonIdentifier;
    } finally {
      inFlightSalonIdResolutions.delete(salonIdentifier);
    }
  })();

  inFlightSalonIdResolutions.set(salonIdentifier, resolvePromise);
  return resolvePromise;
}
