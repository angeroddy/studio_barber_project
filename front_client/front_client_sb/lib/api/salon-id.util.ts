import { apiRequest } from './config';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveSalonId(salonIdentifier: string): Promise<string> {
  if (!salonIdentifier || UUID_REGEX.test(salonIdentifier)) {
    return salonIdentifier;
  }

  try {
    const response = await apiRequest<{
      success: boolean;
      data?: { id: string };
    }>(`/salons/slug/${encodeURIComponent(salonIdentifier)}`);

    return response.data?.id || salonIdentifier;
  } catch {
    return salonIdentifier;
  }
}
