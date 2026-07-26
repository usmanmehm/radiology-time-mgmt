import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ChartComponent } from '../chart/chart.component';
import { TimeEntryComponent } from '../time-entry/time-entry.component';
import dayjs from 'dayjs';
import { WorkViewComponent } from '../work-view/work-view.component';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { WorkingSessionService } from '../../services/working-session.service';
import { MatDialog } from '@angular/material/dialog';
import { RadDialogComponent } from '../rad-dialog/rad-dialog.component';
import { BlockOfTime, SessionInfo, SessionModes } from '../../models';

@Component({
  selector: 'app-classic-workspace',
  imports: [ChartComponent, TimeEntryComponent, WorkViewComponent, CommonModule, ProgressBarComponent],
  templateUrl: './classic-workspace.component.html',
  styleUrl: './classic-workspace.component.scss'
})
export class ClassicWorkspaceComponent implements OnInit {
  startTime = 9;
  endTime = 17;
  mode: SessionModes = SessionModes.NumCases;
  workingSessions: BlockOfTime[] = [];
  breaks: BlockOfTime[] = [];
  sessionInProgress = false;
  currentCase!: BlockOfTime;
  sessionStartTime!: Date;
  sessionEndTime!: string;
  sessionEndDate!: Date;
  currentCaseNumber!: number | undefined;
  sessionDetails!: SessionInfo;
  previousCases: BlockOfTime[] = [];

  timePerCase!: number;
  totalCases = 0;

  dialog = inject(MatDialog);

  @ViewChild('signCaseAudio') signCaseAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('signCaseWarningAudio') signCaseWarningAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('signCaseDangerAudio') signCaseDangerAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('signCaseOverTime') signCaseOverTime!: ElementRef<HTMLAudioElement>;
  @ViewChild('allCasesCompleted') allCasesCompleted!: ElementRef<HTMLAudioElement>;
  @ViewChild('startSessionAudio') startSessionAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('timeUpForCase') timeUpForCase!: ElementRef<HTMLAudioElement>;

  constructor(public sessionService: WorkingSessionService) {}

  ngOnInit() {
    // Load session state on component init
    this.loadSessionState();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.sessionInProgress && !this.isOnBreak()) {
        if (e.code === 'Space' && e.target === document.body) {
          e.preventDefault();
          this.onSignCase();
        }
      }
      if (e.code === 'Escape' && this.sessionInProgress) {
        if (confirm('Are you sure you want to end the session?')) {
          this.onEndSession();
        }
      }
    });
  }

  isOnBreak(): boolean {
    if (!this.sessionDetails?.breaks?.length) return false;
    const now = dayjs();
    return this.sessionDetails.breaks.some(b =>
      now.isAfter(dayjs(b.start)) && now.isBefore(dayjs(b.end))
    );
  }

  setSessionDetails(details: SessionInfo, sessionStart = false) {
    if (sessionStart) {
      this.totalCases = 0;
      this.currentCaseNumber = undefined;
      this.startSessionAudio.nativeElement.play();
      // Save session state on start
      this.saveSessionState();
    }


    if (this.totalCases === 0) {
      this.totalCases = details.numCases;
    }

    this.mode = details.mode ?? this.mode;
    this.sessionDetails = details;
    this.startTime = details.startTime.getHours();
    this.sessionStartTime = details.startTime;

    const now = new Date();
    const casesLeft = details.numCases - this.previousCases.length;
    this.sessionService.casesLeftPercentage = Math.floor(casesLeft / details.numCases * 100);
    this.sessionService.casesLeftText = `${casesLeft}/${details.numCases}`

    let timePerCase: number;

    if (this.mode === SessionModes.TimePerCase) {
      // Fixed pace: the user set a time-per-case budget, so it drives the schedule and the
      // end time becomes a projection instead of a hard constraint.
      timePerCase = details.timePerCase;
    } else {
      // Auto: fit the remaining cases into the time left before the target end time.
      // Calculate remaining break time (only breaks that are in the future)
      const remainingBreakTimeMs = (details.breaks || []).reduce(
        (accumulator, currentValue) => {
          const breakStart = dayjs(currentValue.start);
          const breakEnd = dayjs(currentValue.end);
          const nowDayjs = dayjs(now);

          // Only count break time that is in the future
          if (breakEnd.isAfter(nowDayjs)) {
            // Break hasn't started yet - count full break duration
            if (breakStart.isAfter(nowDayjs)) {
              return accumulator + breakEnd.diff(breakStart);
            }
            // Break has started but not ended - count remaining break time
            else {
              return accumulator + breakEnd.diff(nowDayjs);
            }
          }
          // Break has already ended - don't count it
          return accumulator;
        },
        0,
      );

      // Calculate time per case: (remaining time - remaining break time) / cases left
      // Use current time instead of original start time
      const remainingTimeMs = dayjs(details.endTime).diff(now);
      timePerCase = this.millisecondsToMinutes((remainingTimeMs - remainingBreakTimeMs) / casesLeft);
    }

    const blocksOfTime: BlockOfTime[] = [];

    // Start from current time (or last completed case end time) for remaining cases
    let startTime: number;
    const lastCase = this.previousCases.length > 0 ? this.previousCases[this.previousCases.length - 1] : null;
    if (lastCase && lastCase.endTime) {
      // Use the end time of the last completed case
      startTime = this.getMinutePosition(lastCase.endTime);
    } else {
      // Use current time if no cases completed yet
      startTime = this.getMinutePosition(now);
    }
    for (let i = 0; i < details.numCases; i++) {
      if (this.previousCases[i]) {
        blocksOfTime.push(this.previousCases[i]);
        startTime = this.previousCases[i].to
      } else {
        let endTime = startTime + timePerCase;
        const breakOverlapsWithStart = (details.breaks || []).findIndex(val => {
          const breakStart = this.getMinutePosition(val.start);
          const breakEnd = this.getMinutePosition(val.end);
          return breakStart <= startTime && breakEnd > (startTime);
        });
        const breakOverlapsWithEnd = (details.breaks || []).findIndex(val => this.getMinutePosition(val.start) < endTime && this.getMinutePosition(val.end) > (endTime));

        if (breakOverlapsWithStart >= 0 && details.breaks?.length) {
          startTime = this.getMinutePosition(details.breaks[breakOverlapsWithStart].end);
          endTime = startTime + timePerCase;
        }

        const shouldSplitBlock = breakOverlapsWithStart === -1 && breakOverlapsWithEnd >= 0

        if (shouldSplitBlock  && details.breaks?.length) {
          // in this scenario, we have to split the working session to be around the break
          const endTime1 = this.getMinutePosition(details.breaks[breakOverlapsWithEnd].start) - 1;
          const startTime1 = this.getMinutePosition(details.breaks[breakOverlapsWithEnd].end) + 1;
          const timeLeftAfterFirstSession = (timePerCase - (endTime1 - startTime));

          blocksOfTime.push({
            from: startTime,
            to: this.getMinutePosition(details.breaks[breakOverlapsWithEnd].start) - 1,
            description: 'Case #' + (i + 1) + ' - First Session (before break)'
          });

          blocksOfTime.push({
            from: this.getMinutePosition(details.breaks[breakOverlapsWithEnd].end) + 1,
            to: startTime1 + timeLeftAfterFirstSession,
            description: 'Case #' + (i + 1) + ' - Second Session (after break)'
          });
        }

        if (!shouldSplitBlock) {
          blocksOfTime.push({
            from: startTime,
            to: endTime,
            description: 'Case #' + (i + 1)
          });
        }

        startTime += timePerCase;
      }
    }

    this.timePerCase = timePerCase;
    this.workingSessions = blocksOfTime;
    this.breaks = (details.breaks || []).map(el => ({
      from: this.getMinutePosition(el.start),
      to: this.getMinutePosition(el.end),
      description: 'Break',
      startTime: el.start,
      endTime: el.end
    }));

    // In fixed-pace mode the end time is derived from where the last case lands rather
    // than being a hard input; in auto mode the target end time is the hard constraint.
    if (this.mode === SessionModes.TimePerCase && blocksOfTime.length) {
      this.sessionEndDate = this.minutePositionToDate(blocksOfTime[blocksOfTime.length - 1].to, now);
    } else {
      this.sessionEndDate = details.endTime;
    }
    this.endTime = this.sessionEndDate.getHours();
    this.sessionEndTime = dayjs(this.sessionEndDate).format('hh:mm A');

    this.sessionInProgress = true;
    // Only increment case number on initial session start, not on recalculation
    if (sessionStart) {
      this.currentCaseNumber = 0;
    } else if (this.currentCaseNumber === undefined) {
      this.currentCaseNumber = 0;
    }
    this.currentCase = this.workingSessions[this.currentCaseNumber as number];
    this.currentCase.startTime = new Date();
  }

  millisecondsToMinutes(milliseconds: number) {
    return milliseconds / 1000 / 60;
  }

  getMinutePosition(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  minutePositionToDate(minutePosition: number, referenceDate: Date): Date {
    const result = new Date(referenceDate);
    result.setHours(0, 0, 0, 0);
    result.setMinutes(minutePosition);
    return result;
  }

  formatDisplayTime(time: number): string {
    // want to display as mm:ss
    // fix
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  onTimeUp() {
    this.timeUpForCase.nativeElement.play();
  }

  onSignCase() {
    this.playSignCaseAudio();

    // Add the completed case to previous cases
    this.previousCases.push({
      ...this.currentCase,
      to: this.getMinutePosition(new Date()),
      endTime: new Date()
    });

    // Increment case number
    this.currentCaseNumber = (this.currentCaseNumber || 0) + 1;

    if (this.sessionDetails.numCases === this.previousCases.length) {
      this.allCasesCompleted.nativeElement.play();
      this.currentCaseNumber = undefined;
      // Show completion in dialog instead of alert
      this.onEndSession(true);
      return;
    }

    // Recalculate session details with updated case count
    this.setSessionDetails({
      ...this.sessionDetails,
    });

    // Save session state
    this.saveSessionState();
  }

  onEndSession(complete = false) {
    if (complete) {
      this.openCompletionDialog();
    } else {
      this.openDialog();
    }
    this.sessionInProgress = false;
    this.breaks = [];
    this.workingSessions = [];
    this.previousCases = [];
    // Clear saved session state
    this.clearSessionState();
  }

  saveSessionState() {
    const state = {
      sessionDetails: this.sessionDetails,
      previousCases: this.previousCases,
      currentCaseNumber: this.currentCaseNumber,
      totalCases: this.totalCases,
      sessionStartTime: this.sessionStartTime,
      sessionEndTime: this.sessionEndTime,
      sessionEndDate: this.sessionEndDate,
      timePerCase: this.timePerCase,
      workingSessions: this.workingSessions,
      breaks: this.breaks,
      sessionInProgress: this.sessionInProgress
    };
    localStorage.setItem('radiologySessionState', JSON.stringify(state));
  }

  loadSessionState() {
    const saved = localStorage.getItem('radiologySessionState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.sessionInProgress) {
          // Restore dates from strings
          if (state.sessionDetails) {
            state.sessionDetails.startTime = new Date(state.sessionDetails.startTime);
            state.sessionDetails.endTime = new Date(state.sessionDetails.endTime);
            if (state.sessionDetails.breaks) {
              state.sessionDetails.breaks = state.sessionDetails.breaks.map((b: any) => ({
                ...b,
                start: new Date(b.start),
                end: new Date(b.end)
              }));
            }
          }
          if (state.previousCases) {
            state.previousCases = state.previousCases.map((c: any) => ({
              ...c,
              startTime: c.startTime ? new Date(c.startTime) : undefined,
              endTime: c.endTime ? new Date(c.endTime) : undefined
            }));
          }
          if (state.sessionStartTime) state.sessionStartTime = new Date(state.sessionStartTime);
          if (state.sessionEndDate) state.sessionEndDate = new Date(state.sessionEndDate);
          if (state.breaks) {
            state.breaks = state.breaks.map((b: any) => ({
              ...b,
              startTime: b.startTime ? new Date(b.startTime) : undefined,
              endTime: b.endTime ? new Date(b.endTime) : undefined
            }));
          }

          this.sessionDetails = state.sessionDetails;
          this.previousCases = state.previousCases || [];
          this.currentCaseNumber = state.currentCaseNumber;
          this.totalCases = state.totalCases;
          this.sessionStartTime = state.sessionStartTime;
          this.sessionEndTime = state.sessionEndTime;
          this.sessionEndDate = state.sessionEndDate;
          this.timePerCase = state.timePerCase;
          this.workingSessions = state.workingSessions || [];
          this.breaks = state.breaks || [];
          this.sessionInProgress = state.sessionInProgress;

          // Recalculate and restore current case
          this.setSessionDetails(this.sessionDetails, false);
        }
      } catch (e) {
        console.error('Error loading session state:', e);
        this.clearSessionState();
      }
    }
  }

  clearSessionState() {
    localStorage.removeItem('radiologySessionState');
  }

  onEndBreak(index: number) {
    if (!this.sessionDetails?.breaks?.length) return;
    // end the break early by setting end to now
    const updatedBreaks = [...(this.sessionDetails.breaks || [])];
    updatedBreaks[index] = { ...updatedBreaks[index], end: new Date(), confirmed: true };
    this.sessionDetails = { ...this.sessionDetails, breaks: updatedBreaks };
    // Recalculate schedule based on updated breaks
    this.setSessionDetails(this.sessionDetails);
  }

  openDialog(): void {
    const totalTime = this.previousCases.reduce((acc, case_) => {
      if (case_.startTime && case_.endTime) {
        return acc + (dayjs(case_.endTime).diff(dayjs(case_.startTime)));
      }
      return acc;
    }, 0);

    const avgTimePerCase = this.previousCases.length > 0
      ? Math.floor(totalTime / this.previousCases.length / 1000 / 60) + ':' +
        String(Math.floor((totalTime / this.previousCases.length / 1000) % 60)).padStart(2, '0')
      : '0:00';

    this.dialog.open(RadDialogComponent, {
      width: '500px',
      minHeight: '400px',
      data: {
        header: 'Session Summary',
        timePerCase: this.sessionService.timePerCase,
        avgTimePerCase: avgTimePerCase,
        startTime: dayjs(this.sessionStartTime).format('hh:mm A'),
        endTime: this.sessionEndTime,
        casesCompleted: this.previousCases.length,
        totalCases: this.totalCases,
        completionRate: this.totalCases > 0 ? Math.round((this.previousCases.length / this.totalCases) * 100) : 0,
        totalSessionTime: dayjs(new Date()).diff(dayjs(this.sessionStartTime), 'minute') + ' minutes'
      }
    });
  }

  openCompletionDialog(): void {
    const totalTime = this.previousCases.reduce((acc, case_) => {
      if (case_.startTime && case_.endTime) {
        return acc + (dayjs(case_.endTime).diff(dayjs(case_.startTime)));
      }
      return acc;
    }, 0);

    const avgTimePerCase = this.previousCases.length > 0
      ? Math.floor(totalTime / this.previousCases.length / 1000 / 60) + ':' +
        String(Math.floor((totalTime / this.previousCases.length / 1000) % 60)).padStart(2, '0')
      : '0:00';

    this.dialog.open(RadDialogComponent, {
      width: '500px',
      minHeight: '400px',
      data: {
        header: '🎉 All Cases Completed!',
        timePerCase: this.sessionService.timePerCase,
        avgTimePerCase: avgTimePerCase,
        startTime: dayjs(this.sessionStartTime).format('hh:mm A'),
        endTime: this.sessionEndTime,
        casesCompleted: this.previousCases.length,
        totalCases: this.totalCases,
        completionRate: 100,
        totalSessionTime: dayjs(new Date()).diff(dayjs(this.sessionStartTime), 'minute') + ' minutes',
        isCompletion: true
      }
    });
  }

  playSignCaseAudio() {
    if (this.sessionService.negativeTime) {
      this.signCaseOverTime.nativeElement.play();
      return;
    }

    if (this.sessionService.showDanger) {
      this.signCaseDangerAudio.nativeElement.play();
      return;
    }
    if (this.sessionService.showWarning) {
      this.signCaseWarningAudio.nativeElement.play();
      return;
    }

    this.signCaseAudio.nativeElement.play();
    return;
  }
}
