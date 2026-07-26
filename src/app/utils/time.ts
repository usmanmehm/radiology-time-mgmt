import { BreakInfo } from '../models';

/**
 * Rounds a date to the nearest interval and zeroes out seconds/ms. mat-timepicker only
 * highlights an option when it matches the selected value's hours/minutes/seconds exactly,
 * so an unaligned "now" (e.g. 14:37:22.583) never matches anything and the panel opens
 * scrolled to the top instead of near the current time.
 */
export function roundToNearestMinutes(date: Date, intervalMinutes = 5): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  const remainder = minutes % intervalMinutes;
  const roundedMinutes = remainder < intervalMinutes / 2 ? minutes - remainder : minutes + (intervalMinutes - remainder);
  result.setMinutes(roundedMinutes, 0, 0);
  return result;
}

export function createDefaultBreak(durationMinutes = 30, intervalMinutes = 5): BreakInfo {
  const start = roundToNearestMinutes(new Date(), intervalMinutes);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start, end, confirmed: false };
}
