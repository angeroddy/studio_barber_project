import { api } from './index';
import { resolveSalonId } from './salon-id.util';

export async function getSalonByIdentifier(identifier: string) {
  try {
    return await api.salons.getSalonById(identifier);
  } catch {
    return api.salons.getSalonBySlug(identifier);
  }
}

export async function getSalonClosedDaysByIdentifier(identifier: string): Promise<number[]> {
  try {
    const resolvedSalonId = await resolveSalonId(identifier);
    const schedules = await api.salons.getSchedules(resolvedSalonId);
    const closedDays = new Set<number>();

    schedules.forEach((schedule) => {
      if (schedule.isClosed) {
        closedDays.add(schedule.dayOfWeek);
      }
    });

    return Array.from(closedDays).sort((a, b) => a - b);
  } catch {
    return [];
  }
}
