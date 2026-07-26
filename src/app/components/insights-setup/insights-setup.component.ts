import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BreakComponent } from '../break/break.component';
import { BreakInfo } from '../../models';
import { CaseType } from '../../models-insights';
import { InsightsShiftService } from '../../services/insights-shift.service';
import { createDefaultBreak } from '../../utils/time';

@Component({
  selector: 'app-insights-setup',
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule, MatButtonModule, MatIconModule, BreakComponent],
  templateUrl: './insights-setup.component.html',
  styleUrl: './insights-setup.component.scss'
})
export class InsightsSetupComponent {
  shiftEnd = new Date();
  caseTypes: CaseType[] = [
    { name: 'CT', targetMinutes: 15, count: 10 }
  ];
  breaks: BreakInfo[] = [];

  @Output() shiftStarted = new EventEmitter<void>();
  @ViewChild('startSessionAudio') startSessionAudio!: ElementRef<HTMLAudioElement>;

  constructor(private shiftService: InsightsShiftService) {
    this.shiftEnd.setHours(18, 0, 0, 0);
  }

  get totalCases(): number {
    return this.caseTypes.reduce((acc, ct) => acc + (Number(ct.count) || 0), 0);
  }

  get totalBudgetedHours(): number {
    const minutes = this.caseTypes.reduce((acc, ct) => acc + (Number(ct.count) || 0) * (Number(ct.targetMinutes) || 0), 0);
    return Math.round((minutes / 60) * 10) / 10;
  }

  addCaseType() {
    this.caseTypes.push({ name: '', targetMinutes: 10, count: 1 });
  }

  removeCaseType(i: number) {
    this.caseTypes.splice(i, 1);
  }

  addBreak() {
    this.breaks.push(createDefaultBreak());
  }

  startShift() {
    const now = new Date();
    if (now >= this.shiftEnd) {
      alert('Shift end time must be in the future');
      return;
    }

    const validTypes = this.caseTypes.filter(ct => ct.name?.trim() && ct.count > 0 && ct.targetMinutes > 0);
    if (!validTypes.length) {
      alert('Add at least one case type with a name, a count, and a target time per case');
      return;
    }

    const unconfirmedBreaks = this.breaks.filter(b => !b.confirmed);
    if (unconfirmedBreaks.length) {
      const proceed = confirm(`You have ${unconfirmedBreaks.length} unconfirmed break(s). These will be ignored. Continue?`);
      if (!proceed) return;
    }

    this.shiftService.startShift({
      shiftEnd: this.shiftEnd,
      caseTypes: validTypes,
      breaks: this.breaks.filter(b => b.confirmed)
    });

    this.startSessionAudio?.nativeElement.play();
    this.shiftStarted.emit();
  }
}
