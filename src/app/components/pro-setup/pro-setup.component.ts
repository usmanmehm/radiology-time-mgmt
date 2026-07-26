import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import dayjs from 'dayjs';
import { BreakComponent } from '../break/break.component';
import { BreakInfo } from '../../models';
import { CaseType, ShiftScheduleMode } from '../../models-pro';
import { ProShiftService } from '../../services/pro-shift.service';
import { createDefaultBreak } from '../../utils/time';

@Component({
  selector: 'app-pro-setup',
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule, MatButtonModule, MatButtonToggleModule, MatIconModule, BreakComponent],
  templateUrl: './pro-setup.component.html',
  styleUrl: './pro-setup.component.scss'
})
export class ProSetupComponent {
  Modes = ShiftScheduleMode;
  mode: ShiftScheduleMode = ShiftScheduleMode.ByEndTime;

  shiftEnd = new Date();
  caseTypes: CaseType[] = [
    { name: 'CT', targetMinutes: 15, count: 10 }
  ];
  breaks: BreakInfo[] = [];

  @Output() shiftStarted = new EventEmitter<void>();
  @ViewChild('startSessionAudio') startSessionAudio!: ElementRef<HTMLAudioElement>;

  constructor(private shiftService: ProShiftService) {
    this.shiftEnd.setHours(18, 0, 0, 0);
  }

  get totalCases(): number {
    return this.caseTypes.reduce((acc, ct) => acc + (Number(ct.count) || 0), 0);
  }

  get totalBudgetedMinutes(): number {
    return this.caseTypes.reduce((acc, ct) => acc + (Number(ct.count) || 0) * (Number(ct.targetMinutes) || 0), 0);
  }

  get totalBudgetedHours(): number {
    const minutes = this.mode === ShiftScheduleMode.ByEndTime
      ? this.derivedMinutesPerCase * this.totalCases
      : this.totalBudgetedMinutes;
    return Math.round((minutes / 60) * 10) / 10;
  }

  get confirmedBreakMinutes(): number {
    return this.breaks
      .filter(b => b.confirmed)
      .reduce((acc, b) => acc + (new Date(b.end).getTime() - new Date(b.start).getTime()), 0) / 60000;
  }

  /**
   * In "by end time" mode mins/case isn't chosen — every queued case gets an equal share of
   * the time left until the chosen end, after setting aside the confirmed breaks.
   */
  get derivedMinutesPerCase(): number {
    if (this.totalCases <= 0) return 0;
    const availableMinutes = (this.shiftEnd.getTime() - Date.now()) / 60000 - this.confirmedBreakMinutes;
    return Math.max(0, Math.round((availableMinutes / this.totalCases) * 10) / 10);
  }

  /** In "by budget" mode the end time isn't chosen, it's projected from the case budgets + confirmed breaks. */
  get estimatedEndTime(): Date {
    return new Date(Date.now() + (this.totalBudgetedMinutes + this.confirmedBreakMinutes) * 60 * 1000);
  }

  get estimatedEndTimeLabel(): string {
    return dayjs(this.estimatedEndTime).format('hh:mm A');
  }

  /** The end time that's actually in force, given the active mode - used for break validation and to start the shift. */
  get effectiveShiftEnd(): Date {
    return this.mode === ShiftScheduleMode.ByEndTime ? this.shiftEnd : this.estimatedEndTime;
  }

  /** What the Mins/case field shows: the user's own budget, or the derived share in "by end time" mode. */
  displayMinutes(ct: CaseType): number {
    return this.mode === ShiftScheduleMode.ByEndTime ? this.derivedMinutesPerCase : ct.targetMinutes;
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
    const shiftEnd = this.effectiveShiftEnd;
    if (now >= shiftEnd) {
      alert('Shift end time must be in the future');
      return;
    }

    const byEndTime = this.mode === ShiftScheduleMode.ByEndTime;
    let validTypes = this.caseTypes.filter(ct => ct.name?.trim() && ct.count > 0 && (byEndTime || ct.targetMinutes > 0));
    if (!validTypes.length) {
      alert(byEndTime
        ? 'Add at least one case type with a name and a count'
        : 'Add at least one case type with a name, a count, and a target time per case');
      return;
    }

    if (byEndTime) {
      const perCase = this.derivedMinutesPerCase;
      if (perCase <= 0) {
        alert('Not enough time before the shift ends to fit these cases and breaks. Push the end time later or trim the worklist.');
        return;
      }
      validTypes = validTypes.map(ct => ({ ...ct, targetMinutes: perCase }));
    }

    const unconfirmedBreaks = this.breaks.filter(b => !b.confirmed);
    if (unconfirmedBreaks.length) {
      const proceed = confirm(`You have ${unconfirmedBreaks.length} unconfirmed break(s). These will be ignored. Continue?`);
      if (!proceed) return;
    }

    this.shiftService.startShift({
      shiftEnd,
      caseTypes: validTypes,
      breaks: this.breaks.filter(b => b.confirmed)
    });

    this.startSessionAudio?.nativeElement.play();
    this.shiftStarted.emit();
  }
}
