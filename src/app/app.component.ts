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

    // have to find way to populate list of {from, to} objects from this for chart component to consume
    // without any breaks, very simple --> only one object from startTime to endTime
    // with breaks, there have to be multiple objects for working sessions and multiple objects for breaks

    // also have to think about adding a slider on the chart component for the current minute
    // also have to think about adding hover functionality so that user knows what block of time
    // corresponds to what (ex. hovering over working session 1 along with details like number of cases in this block)
  } 
}
