import { Component } from '@angular/core';
import { ChartComponent } from './components/chart/chart.component';
import { TimeEntryComponent } from './components/time-entry/time-entry.component';

export interface SessionInfo {
  startTime: Date;
  endTime: Date;
  timePerCase: number;
  numCases: number;
}

@Component({
  selector: 'app-root',
  imports: [ChartComponent, TimeEntryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'radiology-time-mgmt';
  startTime = 9;
  endTime = 17;

  setSessionDetails(details: SessionInfo) {
    this.startTime = details.startTime.getHours();
    this.endTime = details.endTime.getHours();
  } 
}
