import { Component, ElementRef, inject, ViewChild, viewChild } from '@angular/core';
import { ChartComponent } from './components/chart/chart.component';
import { TimeEntryComponent } from './components/time-entry/time-entry.component';
import dayjs from 'dayjs';
import { WorkViewComponent } from './components/work-view/work-view.component';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from "./components/progress-bar/progress-bar.component";
import { WorkingSessionService } from './services/working-session.service';
import { MatDialog } from '@angular/material/dialog';
import { RadDialogComponent } from './components/rad-dialog/rad-dialog.component';

export interface SessionInfo {
  startTime: Date;
  endTime: Date;
  timePerCase: number;
  numCases: number;
  breaks?: BreakInfo[];
}

export interface BlockOfTime {
  from: number; // expected minute position for start
  to: number; // expected/calculated minute position for end
  description?: string;
  startTime?: Date; // actual start time for block
  endTime?: Date; // actual end time for block
}

export interface BreakInfo {
  start: Date;
  end: Date;
  confirmed: boolean;
}

export enum SessionModes {
  NumCases = 'numCases',
  TimePerCase = 'timePerCase'
}

@Component({
  selector: 'app-root',
  imports: [ChartComponent, TimeEntryComponent, WorkViewComponent, CommonModule, ProgressBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'radiology-time-mgmt';
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

  setSessionDetails(details: SessionInfo, sessionStart = false) {
    if (sessionStart) {
      this.totalCases = 0;
      this.currentCaseNumber = undefined;
      this.startSessionAudio.nativeElement.play();

    }


    if (this.totalCases === 0) {
      this.totalCases = details.numCases;
    }

    this.sessionDetails = details;
    this.startTime = details.startTime.getHours();
    this.endTime = details.endTime.getHours();
    this.sessionEndDate = details.endTime;
    this.sessionStartTime = details.startTime;
    this.sessionEndTime = dayjs(details.endTime).format('hh:mm A');

    // populate working session blocks for calendar representation
    if (this.mode === SessionModes.NumCases) {
      const totalBreakTimeMs = (details.breaks || []).reduce(
        (accumulator, currentValue) => {
          return accumulator + (dayjs(currentValue.end).diff(dayjs(currentValue.start)))
        },
        0,
      );
      const casesLeft = details.numCases - this.previousCases.length;
      this.sessionService.casesLeftPercentage = Math.floor(casesLeft / details.numCases * 100);
      this.sessionService.casesLeftText = `${casesLeft}/${details.numCases}`

      const timePerCase = this.millisecondsToMinutes(((dayjs(details.endTime).diff(dayjs(details.startTime)) - totalBreakTimeMs) / casesLeft));
      const blocksOfTime: BlockOfTime[] = [];
      let startTime = this.getMinutePosition(details.startTime);
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
    }


    // may not be relevant but whatever lol
    if (!details.breaks?.length) {
      const timePerCase = this.millisecondsToMinutes((dayjs(details.endTime).diff(dayjs(details.startTime)) / details.numCases));
    }

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
      alert("YOU'RE ALL DONE!");
      this.allCasesCompleted.nativeElement.play();
      this.currentCaseNumber = undefined;
      this.onEndSession();
      return;
    }

    // Recalculate session details with updated case count
    this.setSessionDetails({
      ...this.sessionDetails,
    });
  }

  onEndSession() {
    this.openDialog();
    this.sessionInProgress = false;
    this.breaks = [];
    this.workingSessions = [];
    this.previousCases = [];
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
    this.dialog.open(RadDialogComponent, {
      width: '450px',
      height: '400px',
      data: {
        header: 'Session Summary',
        timePerCase: this.sessionService.timePerCase,
        startTime: this.startTime,
        endTime: this.endTime,
        casesCompleted: this.previousCases.length
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



// TODO
// 1) horizontal bar for time left in the current case (goes down to 0)
// 2) exceeding pace by 20% GREEN, keeping pace within +-20% YELLOW, below 80% of the current pace RED
// 3) audio functionality - waiting on sound clips for different events
// 4) starting drop down at 6am
// 5) Three vertical bars - 1: number of cases left, 2: time left per case, 3: OVerall time for entire session
// 6) Mobile/tablet mode