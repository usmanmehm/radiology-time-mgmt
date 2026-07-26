import { createDefaultBreak, roundToNearestMinutes } from './time';

describe('roundToNearestMinutes', () => {
  it('rounds down when closer to the previous interval', () => {
    const date = new Date(2026, 0, 1, 14, 37, 22, 583);
    const rounded = roundToNearestMinutes(date, 5);
    expect(rounded.getMinutes()).toBe(35);
    expect(rounded.getSeconds()).toBe(0);
    expect(rounded.getMilliseconds()).toBe(0);
  });

  it('rounds up when closer to the next interval', () => {
    const date = new Date(2026, 0, 1, 14, 38, 0, 0);
    const rounded = roundToNearestMinutes(date, 5);
    expect(rounded.getMinutes()).toBe(40);
  });

  it('rolls over into the next hour', () => {
    const date = new Date(2026, 0, 1, 14, 58, 0, 0);
    const rounded = roundToNearestMinutes(date, 5);
    expect(rounded.getHours()).toBe(15);
    expect(rounded.getMinutes()).toBe(0);
  });
});

describe('createDefaultBreak', () => {
  it('produces a start/end pair aligned to the interval grid', () => {
    const breakInfo = createDefaultBreak(30, 5);
    expect(breakInfo.start.getMinutes() % 5).toBe(0);
    expect(breakInfo.start.getSeconds()).toBe(0);
    expect(breakInfo.end.getTime() - breakInfo.start.getTime()).toBe(30 * 60 * 1000);
    expect(breakInfo.confirmed).toBeFalse();
  });
});
