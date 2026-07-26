import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import dayjs from 'dayjs';

export interface TimelineWorkBlock {
  start: Date;
  end: Date;
  label: string;
  stat?: boolean;
  inProgress?: boolean;
}

export interface TimelineBreak {
  start: Date;
  end: Date;
}

interface Segment {
  leftPct: number;
  widthPct: number;
}

@Component({
  selector: 'app-schedule-timeline',
  imports: [CommonModule],
  templateUrl: './schedule-timeline.component.html',
  styleUrl: './schedule-timeline.component.scss'
})
export class ScheduleTimelineComponent implements OnChanges {
  @Input() shiftStart!: Date;
  @Input() shiftEnd!: Date;
  @Input() breaks: TimelineBreak[] = [];
  @Input() workBlocks: TimelineWorkBlock[] = [];
  @Input() now: Date | null = null;

  breakSegments: (Segment & { info: TimelineBreak })[] = [];
  workSegments: (Segment & { info: TimelineWorkBlock })[] = [];
  hourMarks: { leftPct: number; label: string }[] = [];
  nowPct: number | null = null;
  targetEndPct = 100;
  runningOver = false;

  private rangeStart = 0;
  private rangeEnd = 0;

  ngOnChanges() {
    if (!this.shiftStart || !this.shiftEnd) return;

    const start = dayjs(this.shiftStart);
    let end = dayjs(this.shiftEnd);
    const candidateEnds = [
      this.now ? dayjs(this.now) : null,
      ...this.workBlocks.map(b => dayjs(b.end)),
      ...this.breaks.map(b => dayjs(b.end))
    ];
    candidateEnds.forEach(c => {
      if (c && c.isAfter(end)) end = c;
    });
    if (!end.isAfter(start)) end = start.add(1, 'hour');

    this.rangeStart = start.valueOf();
    this.rangeEnd = end.valueOf();
    this.runningOver = end.isAfter(dayjs(this.shiftEnd));

    this.breakSegments = this.breaks.map(b => ({
      info: b,
      leftPct: this.pct(b.start),
      widthPct: Math.max(0.6, this.pct(b.end) - this.pct(b.start))
    }));

    this.workSegments = this.workBlocks.map(b => ({
      info: b,
      leftPct: this.pct(b.start),
      widthPct: Math.max(0.6, this.pct(b.end) - this.pct(b.start))
    }));

    this.targetEndPct = this.pct(this.shiftEnd);
    this.nowPct = this.now ? this.pct(this.now) : null;
    this.hourMarks = this.buildHourMarks(start, end);
  }

  formatTime(d: Date): string {
    return dayjs(d).format('h:mm A');
  }

  private buildHourMarks(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    const marks: { leftPct: number; label: string }[] = [];
    let cursor = start.second(0).millisecond(0);
    if (cursor.minute() !== 0) {
      cursor = cursor.add(1, 'hour').startOf('hour');
    }
    while (cursor.isBefore(end)) {
      marks.push({ leftPct: this.pct(cursor), label: cursor.format('h A') });
      cursor = cursor.add(1, 'hour');
    }
    return marks;
  }

  private pct(d: Date | dayjs.Dayjs): number {
    const t = dayjs(d).valueOf();
    const span = this.rangeEnd - this.rangeStart || 1;
    return Math.max(0, Math.min(100, ((t - this.rangeStart) / span) * 100));
  }
}
