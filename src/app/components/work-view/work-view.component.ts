import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import dayjs from 'dayjs';
import { interval, map, Observable, tap, timer } from 'rxjs';
import { BlockOfTime } from '../../app.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

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
  @Input() caseNumber!: number | undefined;
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
    'You are what you eat',
    'File your taxes'
  ];

  currentQuoteIndex = 0;

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
    this.timeLeft$ = timer(0, 1000).pipe(
      map(_ => dayjs(endTimeForCase).diff(new Date())),
      tap(msDifference => this.isOverTime = msDifference <= 0),
      map(millisecondDifference => this.formatTime(millisecondDifference / 1000 / 60, Math.floor(millisecondDifference / 1000 % 60)))
    );

    const minsPerCase = Math.floor(this.timePerCase);
    const secondsPerCase = Math.floor((this.timePerCase - minsPerCase) * 60);
    this.formattedTimePerCase = this.formatTime(minsPerCase, secondsPerCase);
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
    this.pace = this.formatTime(paceMinutes, paceSeconds);
  }

  toggleBetweenQuotes() {
    setInterval(() => {
      this.currentQuoteIndex = this.currentQuoteIndex < (this.quotes.length - 1) ? this.currentQuoteIndex + 1 : 0;
      this.motivationalQuote = this.quotes[this.currentQuoteIndex];
    }, 45 * 1000)
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

  formatTime(mins: number, seconds: number) {
    mins = mins <= 0 ? Math.ceil(mins) : Math.floor(mins);

    return Math.abs(mins) + ':' + this.formatSecondsWithZeroPadding(seconds);
  }

  onEndSession() {
    this.endSession.emit();
  }

  addMins(mins: number) {
    return new Date().getTime() + (mins * 60 * 1000)
  }
}
