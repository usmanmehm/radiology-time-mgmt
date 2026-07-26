import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { CaseType, QueueItem, ShiftRecord, ShiftSetup, TimelineBreakLog, TimelineCaseLog, TypeBreakdown } from '../models-pro';
import { BreakInfo } from '../models';

export const FATIGUE_THRESHOLD_MINUTES = 60;

const ACTIVE_SHIFT_KEY = 'chronoradActiveShift';
const HISTORY_KEY = 'chronoradShiftHistory';

@Injectable({
  providedIn: 'root'
})
export class ProShiftService {
  shiftActive = false;

  queue: QueueItem[] = [];
  breaks: BreakInfo[] = [];
  shiftStart!: Date;
  shiftEnd!: Date;
  totalCases = 0;

  activeBreakEnd: Date | null = null;
  activeBreakStart: Date | null = null;
  lastBreakEndTime!: Date;

  history: ShiftRecord[] = [];

  // fields refreshed once a second while a shift is active
  currentItem: QueueItem | undefined;
  timeLeftInCase = '0:00';
  msLeftInCase = 0;
  isCaseOverTime = false;
  isOnBreak = false;
  breakTimeLeft = '0:00';
  msLeftInBreak = 0;
  casesPerHour = 0;
  completionRate = 0;
  projectedFinishDeltaMinutes = 0; // positive = ahead of the shift-end target, negative = behind
  fatigueNudge = false;
  continuousWorkMinutes = 0;

  private wasOnBreak = false;
  private tickHandle: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.loadHistory();
    this.loadActiveShift();
  }

  get completedCount(): number {
    return this.queue.filter(q => q.status === 'done').length;
  }

  get pendingQueue(): QueueItem[] {
    return this.queue.filter(q => q.status === 'pending');
  }

  get upcomingItems(): QueueItem[] {
    return this.pendingQueue.slice(1, 4);
  }

  startShift(setup: ShiftSetup) {
    const queue: QueueItem[] = [];
    setup.caseTypes.forEach((ct: CaseType, typeIdx: number) => {
      for (let i = 0; i < ct.count; i++) {
        queue.push({
          id: this.makeId(`t${typeIdx}-${i}`),
          typeName: ct.name,
          targetMinutes: ct.targetMinutes,
          status: 'pending'
        });
      }
    });

    this.queue = queue;
    this.totalCases = queue.length;
    this.breaks = setup.breaks || [];
    this.shiftStart = new Date();
    this.shiftEnd = setup.shiftEnd;
    this.lastBreakEndTime = this.shiftStart;
    this.activeBreakEnd = null;
    this.wasOnBreak = false;
    this.shiftActive = true;

    this.beginCurrentItem();
    this.tick();
    this.saveActiveShift();
    this.startTicking();
  }

  signCurrentCase() {
    if (!this.currentItem) return;
    this.currentItem.status = 'done';
    this.currentItem.endTime = new Date();
    this.isCaseOverTime = false;

    if (this.pendingQueue.length === 0) {
      this.endShift();
      return;
    }

    this.beginCurrentItem();
    this.tick();
    this.saveActiveShift();
  }

  addStatCase(typeName: string, targetMinutes: number) {
    const statItem: QueueItem = {
      id: this.makeId('stat'),
      typeName,
      targetMinutes,
      status: 'pending',
      stat: true
    };

    const currentIdx = this.queue.findIndex(q => q === this.currentItem);
    this.queue.splice(currentIdx + 1, 0, statItem);
    this.totalCases += 1;
    this.tick();
    this.saveActiveShift();
  }

  startBreak(minutes: number) {
    this.activeBreakStart = new Date();
    this.activeBreakEnd = dayjs().add(minutes, 'minute').toDate();
    this.tick();
    this.saveActiveShift();
  }

  /**
   * Ends whichever break is currently active. A pre-planned break (from `this.breaks`) has
   * its own fixed start/end - just clearing `activeBreakEnd` (the on-demand break's end time)
   * did nothing to it, so the scheduled break kept matching in tick() and the UI stayed stuck
   * "on break" until its original end time. Truncate the scheduled break's end to now instead.
   */
  endBreakNow() {
    const now = new Date();
    const scheduledIdx = this.breaks.findIndex(b => dayjs(now).isAfter(dayjs(b.start)) && dayjs(now).isBefore(dayjs(b.end)));
    if (scheduledIdx >= 0) {
      this.breaks[scheduledIdx] = { ...this.breaks[scheduledIdx], end: now };
    }
    this.activeBreakEnd = null;
    this.activeBreakStart = null;
    this.lastBreakEndTime = now;
    this.tick();
    this.saveActiveShift();
  }

  endShift() {
    const record = this.buildShiftRecord();
    if (record) {
      this.history = [record, ...this.history].slice(0, 50);
      this.saveHistory();
    }

    this.stopTicking();
    this.shiftActive = false;
    this.queue = [];
    this.breaks = [];
    this.totalCases = 0;
    this.currentItem = undefined;
    this.activeBreakEnd = null;
    this.activeBreakStart = null;
    localStorage.removeItem(ACTIVE_SHIFT_KEY);
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  private beginCurrentItem() {
    this.currentItem = this.pendingQueue[0];
    if (this.currentItem && !this.currentItem.startTime) {
      this.currentItem.startTime = new Date();
    }
  }

  private buildShiftRecord(): ShiftRecord | null {
    const completed = this.queue.filter(q => q.status === 'done' && q.startTime && q.endTime);
    if (!completed.length) return null;

    const totalWorkedMs = completed.reduce((acc, c) => acc + dayjs(c.endTime).diff(dayjs(c.startTime)), 0);
    const totalMinutesWorked = totalWorkedMs / 1000 / 60;
    const avgPaceMinutes = totalMinutesWorked / completed.length;
    const elapsedShiftMinutes = Math.max(1, dayjs().diff(dayjs(this.shiftStart), 'minute'));
    const casesPerHour = completed.length / (elapsedShiftMinutes / 60);

    const byTypeMap = new Map<string, number>();
    completed.forEach(c => byTypeMap.set(c.typeName, (byTypeMap.get(c.typeName) || 0) + 1));
    const byType: TypeBreakdown[] = Array.from(byTypeMap.entries()).map(([name, count]) => ({ name, completed: count }));

    const caseLog: TimelineCaseLog[] = completed.map(c => ({
      typeName: c.typeName,
      startTime: dayjs(c.startTime).toISOString(),
      endTime: dayjs(c.endTime).toISOString(),
      stat: c.stat
    }));
    const breakLog: TimelineBreakLog[] = this.breaks.map(b => ({
      start: dayjs(b.start).toISOString(),
      end: dayjs(b.end).toISOString()
    }));

    return {
      id: this.makeId('shift'),
      date: new Date().toISOString(),
      shiftEndTarget: dayjs(this.shiftEnd).format('hh:mm A'),
      casesCompleted: completed.length,
      totalCases: this.totalCases,
      completionRate: this.totalCases > 0 ? Math.round((completed.length / this.totalCases) * 100) : 0,
      avgPaceMinutes: Math.round(avgPaceMinutes * 10) / 10,
      casesPerHour: Math.round(casesPerHour * 10) / 10,
      totalMinutesWorked: Math.round(totalMinutesWorked),
      byType,
      shiftStart: dayjs(this.shiftStart).toISOString(),
      shiftEndTargetIso: dayjs(this.shiftEnd).toISOString(),
      caseLog,
      breakLog
    };
  }

  private startTicking() {
    this.stopTicking();
    this.tickHandle = setInterval(() => this.tick(), 1000);
  }

  private stopTicking() {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = undefined;
    }
  }

  private tick() {
    if (!this.shiftActive) return;
    const now = dayjs();

    const scheduledBreak = this.breaks.find(b => now.isAfter(dayjs(b.start)) && now.isBefore(dayjs(b.end)));
    const onDemandActive = !!this.activeBreakEnd && now.isBefore(dayjs(this.activeBreakEnd));
    this.isOnBreak = !!scheduledBreak || onDemandActive;

    if (this.isOnBreak) {
      const breakEnd = scheduledBreak ? scheduledBreak.end : this.activeBreakEnd!;
      this.msLeftInBreak = dayjs(breakEnd).diff(now);
      this.breakTimeLeft = this.formatDuration(this.msLeftInBreak, true);
    } else if (this.activeBreakEnd) {
      this.activeBreakEnd = null;
      this.activeBreakStart = null;
    }

    if (!this.isOnBreak && this.wasOnBreak) {
      this.lastBreakEndTime = now.toDate();
    }
    this.wasOnBreak = this.isOnBreak;

    if (this.currentItem && !this.isOnBreak) {
      const start = this.currentItem.startTime ? dayjs(this.currentItem.startTime) : now;
      this.msLeftInCase = start.add(this.currentItem.targetMinutes, 'minute').diff(now);
      this.isCaseOverTime = this.msLeftInCase <= 0;
      this.timeLeftInCase = this.formatDuration(this.msLeftInCase, false);
    }

    const completed = this.completedCount;
    this.completionRate = this.totalCases > 0 ? Math.round((completed / this.totalCases) * 100) : 0;

    const elapsedMinutes = now.diff(dayjs(this.shiftStart), 'minute', true);
    this.casesPerHour = elapsedMinutes > 0.05 ? Math.round((completed / elapsedMinutes) * 60 * 10) / 10 : 0;

    const remaining = this.pendingQueue.length;
    if (this.casesPerHour > 0 && remaining > 0) {
      const projectedMinutesNeeded = (remaining / this.casesPerHour) * 60;
      const minutesUntilShiftEnd = dayjs(this.shiftEnd).diff(now, 'minute', true);
      this.projectedFinishDeltaMinutes = Math.round(minutesUntilShiftEnd - projectedMinutesNeeded);
    } else {
      this.projectedFinishDeltaMinutes = 0;
    }

    this.continuousWorkMinutes = Math.max(0, now.diff(dayjs(this.lastBreakEndTime), 'minute', true));
    this.fatigueNudge = !this.isOnBreak && this.continuousWorkMinutes >= FATIGUE_THRESHOLD_MINUTES;
  }

  private formatDuration(ms: number, onlyPositive = false): string {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const sign = ms < 0 && !onlyPositive ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private makeId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private saveActiveShift() {
    if (!this.shiftActive) return;
    const state = {
      queue: this.queue,
      breaks: this.breaks,
      shiftStart: this.shiftStart,
      shiftEnd: this.shiftEnd,
      totalCases: this.totalCases,
      activeBreakEnd: this.activeBreakEnd,
      activeBreakStart: this.activeBreakStart,
      lastBreakEndTime: this.lastBreakEndTime
    };
    localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(state));
  }

  private loadActiveShift() {
    const saved = localStorage.getItem(ACTIVE_SHIFT_KEY);
    if (!saved) return;

    try {
      const state = JSON.parse(saved);
      this.queue = (state.queue || []).map((q: any) => ({
        ...q,
        startTime: q.startTime ? new Date(q.startTime) : undefined,
        endTime: q.endTime ? new Date(q.endTime) : undefined
      }));
      this.breaks = (state.breaks || []).map((b: any) => ({ ...b, start: new Date(b.start), end: new Date(b.end) }));
      this.shiftStart = new Date(state.shiftStart);
      this.shiftEnd = new Date(state.shiftEnd);
      this.totalCases = state.totalCases || this.queue.length;
      this.activeBreakEnd = state.activeBreakEnd ? new Date(state.activeBreakEnd) : null;
      this.activeBreakStart = state.activeBreakStart ? new Date(state.activeBreakStart) : null;
      this.lastBreakEndTime = state.lastBreakEndTime ? new Date(state.lastBreakEndTime) : this.shiftStart;
      this.shiftActive = true;

      this.beginCurrentItem();
      this.tick();
      this.startTicking();
    } catch (e) {
      console.error('Error restoring active Pro shift', e);
      localStorage.removeItem(ACTIVE_SHIFT_KEY);
    }
  }

  private loadHistory() {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return;
    try {
      this.history = JSON.parse(saved);
    } catch (e) {
      console.error('Error restoring Pro shift history', e);
      this.history = [];
    }
  }

  private saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }
}
