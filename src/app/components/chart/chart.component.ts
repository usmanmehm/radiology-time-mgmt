import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { BlockOfTime, SessionInfo } from '../../app.component';
import dayjs from 'dayjs';

@Component({
  selector: 'app-chart',
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnInit, OnChanges {
  minutesInADay = 1440;
  minutesArray: any = [...Array(this.minutesInADay).keys()];
  @Input() startHour = 9;
  @Input() endHour = 17;
  minutesShown = 1440;

  formattedStartTime!: string;
  formattedEndTime!: string;

  @Input() breaks = [{
    from: 10 * 60,
    to: 11.5 * 60
  }];

  @Input() workingSessions: BlockOfTime[] = []

  @Input() heightInPixels = 700;

  ngOnInit(): void {
    // this.minutesShown = (this.endHour + 1 - this.startHour) * 60;
  }

  ngOnChanges() {
    this.minutesShown = (this.endHour + 1 - this.startHour) * 60;

    this.populateWorkingSessionInfo();
  }

  getHour(min: number) {
    return Math.floor(min / 60);
  }

  populateWorkingSessionInfo() {
    // this function is to evaluate whether each minute is a working session or a break
    this.minutesArray = this.minutesArray.map((minute: any) => {
      let minuteValue = minute;
      if (minute.minute >= 0) {
        minuteValue = minute.minute;
      }

      const workingSessionIndex = this.workingSessions.findIndex(workMin => minuteValue >= workMin.from && minuteValue <= workMin.to);
      const breakIndex = this.breaks.findIndex(breakMin => minuteValue >= breakMin.from && minuteValue <= breakMin.to);

      return {
        minute: minuteValue,
        break: breakIndex > -1,
        work: workingSessionIndex > -1,
        description: breakIndex > -1 ? 'Break' : workingSessionIndex > -1 ? this.workingSessions[workingSessionIndex].description : ''
      }
    });

  }

  formatHour(hour: number) {
    return dayjs().hour(hour).format('h A');
  }
}
