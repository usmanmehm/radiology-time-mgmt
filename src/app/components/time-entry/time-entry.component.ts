import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {MatTimepickerModule} from '@angular/material/timepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakComponent } from '../break/break.component';
import { BreakInfo, SessionInfo } from '../../app.component';

@Component({
  selector: 'time-entry',
  providers: [provideNativeDateAdapter()],
  imports: [BreakComponent, CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule, MatButtonModule, MatIconModule],
  templateUrl: './time-entry.component.html',
  styleUrl: './time-entry.component.scss'
})
export class TimeEntryComponent implements OnInit {
  breaks!: BreakInfo[];
  startTime = new Date();
  endTime = new Date();
  timePerCase = 15;
  numCases = 10;

  @Output() breakAdded: EventEmitter<{ start: Date, end: Date }> = new EventEmitter();
  @Output() onSessionStart: EventEmitter<SessionInfo> = new EventEmitter();

  ngOnInit(): void {
    this.endTime.setHours(18, 0);
  }

  addBreak() {
    if (!this.breaks) {
      this.breaks = [{
        start: new Date(),
        end: new Date(this.addMins(30)),
        confirmed: false
      }];

      return;
    }

    this.breaks.push({
      start: new Date(),
      end: new Date(this.addMins(30)),
      confirmed: false
    });
  }

  addMins(mins: number) {
    return new Date().getTime() + (mins * 60 * 1000)
  }

  removeBreak(index: number) {
    this.breaks.splice(index);
  }

  startSession() {
    this.onSessionStart.emit({
      startTime: new Date(),
      endTime: this.endTime,
      timePerCase: this.timePerCase,
      numCases: this.numCases,
      breaks: this.breaks?.filter(el => el.confirmed) || []
    });

  }
}
