import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {MatTimepickerModule} from '@angular/material/timepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import dayjs from 'dayjs';
import { BreakComponent } from '../break/break.component';
import { BreakInfo, SessionInfo, SessionModes } from '../../models';
import { createDefaultBreak } from '../../utils/time';

@Component({
  selector: 'time-entry',
  providers: [provideNativeDateAdapter()],
  imports: [BreakComponent, CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule, MatButtonModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './time-entry.component.html',
  styleUrl: './time-entry.component.scss'
})
export class TimeEntryComponent implements OnInit {
  Modes = SessionModes;
  mode: SessionModes = SessionModes.NumCases;

  breaks: BreakInfo[] = [];
  endTime = new Date();
  timePerCase = 15;
  numCases = 10;

  @Output() breakAdded: EventEmitter<{ start: Date, end: Date }> = new EventEmitter();
  @Output() onSessionStart: EventEmitter<SessionInfo> = new EventEmitter();

  ngOnInit(): void {
    // Set default end time to 5 PM
    this.endTime = new Date();
    this.endTime.setHours(18, 0, 0, 0);
  }

  /** The end time that's actually in force, given the active mode - used for break validation. */
  get effectiveEndTime(): Date {
    return this.mode === SessionModes.NumCases ? this.endTime : this.estimatedEndTime;
  }

  /** In "fixed time per case" mode the end time isn't chosen, it's projected from pace + breaks. */
  get estimatedEndTime(): Date {
    const confirmedBreakMs = this.breaks
      .filter(b => b.confirmed)
      .reduce((acc, b) => acc + (new Date(b.end).getTime() - new Date(b.start).getTime()), 0);
    const caseMs = Math.max(0, this.numCases) * Math.max(0, this.timePerCase) * 60 * 1000;
    return new Date(Date.now() + caseMs + confirmedBreakMs);
  }

  get estimatedEndTimeLabel(): string {
    return dayjs(this.estimatedEndTime).format('hh:mm A');
  }

  addBreak() {
    this.breaks.push(createDefaultBreak());
  }

  startSession() {
    if (this.mode === SessionModes.NumCases) {
      if (new Date() >= this.endTime) {
        alert('End time must be in the future');
        return;
      }
    } else if (this.timePerCase <= 0) {
      alert('Time per case must be greater than 0');
      return;
    }

    if (this.numCases <= 0) {
      alert('Number of cases must be greater than 0');
      return;
    }

    if (this.mode === SessionModes.NumCases && this.timePerCase <= 0) {
      this.timePerCase = 1;
    }

    // Check for unconfirmed breaks
    const unconfirmedBreaks = this.breaks?.filter(el => !el.confirmed) || [];
    if (unconfirmedBreaks.length > 0) {
      const confirmed = confirm(`You have ${unconfirmedBreaks.length} unconfirmed break(s). These will be ignored. Do you want to continue?`);
      if (!confirmed) {
        return;
      }
    }

    // Start time is set to current time when user clicks "Start Session"
    this.onSessionStart.emit({
      startTime: new Date(),
      endTime: this.mode === SessionModes.NumCases ? this.endTime : this.estimatedEndTime,
      timePerCase: this.timePerCase,
      numCases: this.numCases,
      mode: this.mode,
      breaks: this.breaks?.filter(el => el.confirmed) || []
    });

  }
}
