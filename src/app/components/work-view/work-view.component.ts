import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import dayjs from 'dayjs';
import { interval, map, Observable, tap, timer } from 'rxjs';
import { BlockOfTime } from '../../app.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { WorkingSessionService } from '../../services/working-session.service';

@Component({
  selector: 'app-work-view',
  imports: [AsyncPipe, MatProgressSpinnerModule, CommonModule, MatButtonModule],
  templateUrl: './work-view.component.html',
  styleUrl: './work-view.component.scss'
})
export class WorkViewComponent implements OnInit, OnChanges {
  @Input() currentCase!: BlockOfTime;
  @Input() sessionStartTime!: Date;
  @Input() sessionEndTime!: string;
  @Input() caseNumber: number | undefined = 0;
  @Input() totalCases!: number;
  @Input() timePerCase!: number;
  @Input() previousCases!: BlockOfTime[];

  formattedTimePerCase!: string;
  motivationalQuote!: string;
  pace!: string;
  isOverTime = false;

  timeLeft$!: Observable<string>;

  @Output() signCase = new EventEmitter<void>();
  @Output() cancelSession = new EventEmitter<void>();
  @Output() endSession = new EventEmitter<void>();

  quotes = [
    `Nobody cares, sign it already`,
    `Nobody cares, work harder`,
    `Remember Allah in times of ease, He'll remember you in times of difficulty`,
    `Bismillah and intention`,
    `Resolve`,
    `One foot in front of another`,
  ];
  secondsOnEachQuote = 60;

  currentQuoteIndex = 0;

  constructor(private sessionService: WorkingSessionService) {}

  ngOnInit(): void {
    this.toggleBetweenQuotes();
    this.motivationalQuote = this.quotes[0];
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    this.getTimeLeft();
    this.calculatePace();
  }

  getTimeLeft() {
    if (!this.currentCase) return;

    const duration = (this.currentCase.to - this.currentCase.from);
    const endTimeForCase = new Date(this.addMins(duration));
    const totalTimeForCase = dayjs(endTimeForCase).diff(new Date());
    this.timeLeft$ = timer(0, 1000).pipe(
      map(_ => dayjs(endTimeForCase).diff(new Date())),
      map(millisecondDifference => {
        this.isOverTime = millisecondDifference <= 0;
        this.sessionService.negativeTime = this.isOverTime;
        this.sessionService.timeLeftPercentage = Math.floor((millisecondDifference / totalTimeForCase) * 100)
        this.sessionService.showWarning = millisecondDifference <= 90 * 1000 ? true : false;
        this.sessionService.showDanger = millisecondDifference <= 30 * 1000 ? true : false;
        this.sessionService.timeLeft = this.formatTime(millisecondDifference / 1000 / 60, Math.floor(millisecondDifference / 1000 % 60));
        return this.sessionService.timeLeft;
      })
    );

    const minsPerCase = Math.floor(this.timePerCase);
    const secondsPerCase = Math.floor((this.timePerCase - minsPerCase) * 60);
    this.formattedTimePerCase = this.formatTime(minsPerCase, secondsPerCase, true);
  }

  calculatePace() {
    if (!this.previousCases.length) return;

    const workingTimeMs = (this.previousCases || []).reduce(
      (accumulator, currentValue) => {
        return accumulator + (dayjs(currentValue.endTime).diff(currentValue.startTime))
      },
      0,
    );

    const timePerCase = workingTimeMs / this.previousCases.length;

    const paceMinutes = Math.floor((timePerCase / 1000 / 60));
    const paceSeconds = Math.floor(timePerCase / 1000 % 60);
    this.pace = this.formatTime(paceMinutes, paceSeconds, true);
    this.sessionService.timePerCase = this.pace;
  }

  toggleBetweenQuotes() {
    setInterval(() => {
      this.currentQuoteIndex = this.currentQuoteIndex < (this.quotes.length - 1) ? this.currentQuoteIndex + 1 : 0;
      this.motivationalQuote = this.quotes[this.currentQuoteIndex];
    }, this.secondsOnEachQuote * 1000)
  }

  onSignCase() {
    this.signCase.emit();
  }

  onCancelSession() {
    this.cancelSession.emit();
  }

  formatSecondsWithZeroPadding(seconds: number) {
    const absSecondsVal = Math.abs(seconds);
    return absSecondsVal < 10 ? '0' + absSecondsVal : absSecondsVal;
  }

  formatTime(mins: number, seconds: number, onlyPositive = false) {
    mins = this.isOverTime ? Math.ceil(mins) : Math.floor(mins);
    const minusSign = this.isOverTime && !onlyPositive ? '-' : '';

    return minusSign + Math.abs(mins) + ':' + this.formatSecondsWithZeroPadding(seconds);
  }

  onEndSession() {
    this.endSession.emit();
  }

  addMins(mins: number) {
    return new Date().getTime() + (mins * 60 * 1000)
  }

  
}
