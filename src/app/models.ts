export interface SessionInfo {
  startTime: Date;
  endTime: Date;
  timePerCase: number;
  numCases: number;
  breaks?: BreakInfo[];
  /** Which value drives the schedule: a target end time (time-per-case is derived) or a fixed time-per-case (end time is derived). */
  mode?: SessionModes;
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
