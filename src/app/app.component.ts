import { Component } from '@angular/core';
import { ChartComponent } from './components/chart/chart.component';
import { TimeEntryComponent } from './components/time-entry/time-entry.component';
import dayjs from 'dayjs';

export interface SessionInfo {
  startTime: Date;
  endTime: Date;
  timePerCase: number;
  numCases: number;
  breaks?: BreakInfo[];
}

export interface BlockOfTime {
  from: number;
  to: number;
  description?: string;
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
  imports: [ChartComponent, TimeEntryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'radiology-time-mgmt';
  startTime = 9;
  endTime = 17;
  mode: SessionModes = SessionModes.NumCases;

  setSessionDetails(details: SessionInfo) {
    this.startTime = details.startTime.getHours();
    this.endTime = details.endTime.getHours();

    console.log(details);

    // have to find way to populate list of {from, to} objects from this for chart component to consume
    // without any breaks, very simple --> only one object from startTime to endTime
    // with breaks, there have to be multiple objects for working sessions and multiple objects for breaks
    if (this.mode === SessionModes.NumCases) {
      const totalBreakTimeMs = (details.breaks || []).reduce(
        (accumulator, currentValue) => {
          return accumulator + (dayjs(currentValue.end).diff(dayjs(currentValue.start)))
        },
        0,
      );
      const timePerCase = this.millisecondsToMinutes(((dayjs(details.endTime).diff(dayjs(details.startTime)) - totalBreakTimeMs) / details.numCases));
      const blocksOfTime: BlockOfTime[] = [];
      let startTime = this.getMinutePosition(details.startTime);
      for (let i = 0; i < details.numCases; i++) {
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
            description: 'Case #' + (i + 1) + '- First Session'
          });

          blocksOfTime.push({
            from: this.getMinutePosition(details.breaks[breakOverlapsWithEnd].start),
            to: this.getMinutePosition(details.breaks[breakOverlapsWithEnd].end),
            description: 'Break'
          })

          blocksOfTime.push({
            from: this.getMinutePosition(details.breaks[breakOverlapsWithEnd].end) + 1,
            to: startTime1 + timeLeftAfterFirstSession,
            description: 'Case #' + (i + 1) + '- Second Session'
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

      console.log(blocksOfTime);
    }


    // may not be relevant but whatever lol
    if (!details.breaks?.length) {
      const timePerCase = this.millisecondsToMinutes((dayjs(details.endTime).diff(dayjs(details.startTime)) / details.numCases));
      console.log(timePerCase);
    }


    // also have to think about adding a slider on the chart component for the current minute
    // also have to think about adding hover functionality so that user knows what block of time
    // corresponds to what (ex. hovering over working session 1 along with details like number of cases in this block)
  }

  millisecondsToMinutes(milliseconds: number) {
    return milliseconds / 1000 / 60;
  }

  getMinutePosition(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
  }
}
