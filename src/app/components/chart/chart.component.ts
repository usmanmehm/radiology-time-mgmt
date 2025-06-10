import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';

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

  breaks = [{
    from: 10 * 60,
    to: 11.5 * 60
  }];

  workingSessions = [
    { from: 9 * 60, to: 10 * 60 },
    { from: 11 * 60, to: 12 * 60 },
    { from: 13 * 60, to: 14 * 60 },
  ]

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
      return {
        minute,
        break: !!this.breaks.find(breakMin => minute > breakMin.from && minute <= breakMin.to),
        work: !!this.workingSessions.find(workMin => minute > workMin.from && minute <= workMin.to)
      }
    });

    console.log(this.minutesArray);
  }
}
