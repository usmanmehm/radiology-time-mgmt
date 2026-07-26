import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import dayjs from 'dayjs';
import { InsightsShiftService } from '../../services/insights-shift.service';
import { ShiftRecord } from '../../models-insights';

@Component({
  selector: 'app-insights-history',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './insights-history.component.html',
  styleUrl: './insights-history.component.scss'
})
export class InsightsHistoryComponent {
  constructor(public shiftService: InsightsShiftService) {}

  get trendShifts(): ShiftRecord[] {
    return [...this.shiftService.history].slice(0, 10).reverse();
  }

  get maxCasesPerHour(): number {
    return Math.max(1, ...this.trendShifts.map(s => s.casesPerHour));
  }

  barHeight(value: number): number {
    return Math.max(4, Math.round((value / this.maxCasesPerHour) * 100));
  }

  formatDate(iso: string): string {
    return dayjs(iso).format('MMM D, h:mm A');
  }

  clearHistory() {
    if (confirm('Clear all saved shift history? This cannot be undone.')) {
      this.shiftService.clearHistory();
    }
  }

  exportCsv() {
    const rows: string[][] = [
      ['Date', 'Cases Completed', 'Total Cases', 'Completion Rate (%)', 'Cases / Hour', 'Avg Pace (min)', 'Total Minutes Worked', 'Study Type Breakdown']
    ];

    this.shiftService.history.forEach(s => {
      rows.push([
        this.formatDate(s.date),
        String(s.casesCompleted),
        String(s.totalCases),
        String(s.completionRate),
        String(s.casesPerHour),
        String(s.avgPaceMinutes),
        String(s.totalMinutesWorked),
        s.byType.map(t => `${t.name}: ${t.completed}`).join('; ')
      ]);
    });

    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronorad-shift-history-${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
