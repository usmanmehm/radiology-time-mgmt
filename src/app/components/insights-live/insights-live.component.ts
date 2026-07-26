import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InsightsShiftService } from '../../services/insights-shift.service';

@Component({
  selector: 'app-insights-live',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './insights-live.component.html',
  styleUrl: './insights-live.component.scss'
})
export class InsightsLiveComponent implements OnInit, OnDestroy {
  showStatForm = false;
  statName = '';
  statMinutes = 10;

  @Output() shiftEnded = new EventEmitter<void>();

  @ViewChild('signCaseAudio') signCaseAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('signCaseWarningAudio') signCaseWarningAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('signCaseDangerAudio') signCaseDangerAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('signCaseOverTime') signCaseOverTime!: ElementRef<HTMLAudioElement>;
  @ViewChild('allCasesCompleted') allCasesCompleted!: ElementRef<HTMLAudioElement>;
  @ViewChild('timeUpForCase') timeUpForCase!: ElementRef<HTMLAudioElement>;
  @ViewChild('thirtySecondWarning') thirtySecondWarning!: ElementRef<HTMLAudioElement>;
  @ViewChild('ninetySecondWarning') ninetySecondWarning!: ElementRef<HTMLAudioElement>;
  @ViewChild('breakStartAudio') breakStartAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('breakEndedAudio') breakEndedAudio!: ElementRef<HTMLAudioElement>;
  @ViewChild('breakEndingSoonAudio') breakEndingSoonAudio!: ElementRef<HTMLAudioElement>;

  // Edge-detection state for the once-per-event warning sounds. Kept here (not in the
  // service) because it's purely about when to play a sound, mirroring how the Classic
  // work-view component owns its own audio-cue bookkeeping.
  private wasOnBreak = false;
  private breakEndingSoonPlayed = false;
  private trackedItemId: string | null = null;
  private thirtySecWarningPlayed = false;
  private ninetySecWarningPlayed = false;
  private timeUpPlayed = false;
  private audioTickHandle: ReturnType<typeof setInterval> | undefined;

  constructor(public shiftService: InsightsShiftService) {}

  ngOnInit() {
    this.wasOnBreak = this.shiftService.isOnBreak;
    this.trackedItemId = this.shiftService.currentItem?.id ?? null;
    this.audioTickHandle = setInterval(() => this.checkAudioCues(), 1000);
  }

  ngOnDestroy() {
    if (this.audioTickHandle) {
      clearInterval(this.audioTickHandle);
    }
  }

  private checkAudioCues() {
    const s = this.shiftService;
    if (!s.shiftActive) return;

    if (s.isOnBreak && !this.wasOnBreak) {
      this.breakStartAudio?.nativeElement.play();
      this.breakEndingSoonPlayed = false;
    } else if (!s.isOnBreak && this.wasOnBreak) {
      this.breakEndedAudio?.nativeElement.play();
    }
    this.wasOnBreak = s.isOnBreak;

    if (s.isOnBreak) {
      if (s.msLeftInBreak <= 30 * 1000 && !this.breakEndingSoonPlayed) {
        this.breakEndingSoonPlayed = true;
        this.breakEndingSoonAudio?.nativeElement.play();
      }
      return;
    }

    const itemId = s.currentItem?.id ?? null;
    if (itemId !== this.trackedItemId) {
      this.trackedItemId = itemId;
      this.thirtySecWarningPlayed = false;
      this.ninetySecWarningPlayed = false;
      this.timeUpPlayed = false;
    }

    if (!s.currentItem) return;

    if (s.isCaseOverTime && !this.timeUpPlayed) {
      this.timeUpPlayed = true;
      this.timeUpForCase?.nativeElement.play();
    }

    if (s.msLeftInCase <= 30 * 1000 && !this.thirtySecWarningPlayed) {
      this.thirtySecWarningPlayed = true;
      this.thirtySecondWarning?.nativeElement.play();
    }

    if (s.msLeftInCase <= 90 * 1000 && !this.ninetySecWarningPlayed) {
      this.ninetySecWarningPlayed = true;
      this.ninetySecondWarning?.nativeElement.play();
    }
  }

  private playSignCaseAudio() {
    const s = this.shiftService;
    if (s.isCaseOverTime) {
      this.signCaseOverTime?.nativeElement.play();
    } else if (s.msLeftInCase <= 30 * 1000) {
      this.signCaseDangerAudio?.nativeElement.play();
    } else if (s.msLeftInCase <= 90 * 1000) {
      this.signCaseWarningAudio?.nativeElement.play();
    } else {
      this.signCaseAudio?.nativeElement.play();
    }
  }

  onSignCase() {
    this.playSignCaseAudio();
    const isLastCase = this.shiftService.pendingQueue.length <= 1;
    this.shiftService.signCurrentCase();
    if (isLastCase) {
      this.allCasesCompleted?.nativeElement.play();
    }
    if (!this.shiftService.shiftActive) {
      this.shiftEnded.emit();
    }
  }

  toggleStatForm() {
    this.showStatForm = !this.showStatForm;
  }

  submitStatCase() {
    if (!this.statName.trim() || this.statMinutes <= 0) return;
    this.shiftService.addStatCase(this.statName.trim(), this.statMinutes);
    this.statName = '';
    this.statMinutes = 10;
    this.showStatForm = false;
  }

  takeBreak(minutes: number) {
    this.shiftService.startBreak(minutes);
  }

  endBreakNow() {
    this.shiftService.endBreakNow();
  }

  onEndShift() {
    if (confirm('End this shift now? Remaining cases will not be counted as completed.')) {
      this.shiftService.endShift();
      this.shiftEnded.emit();
    }
  }
}
