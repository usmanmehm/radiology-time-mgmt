import { BreakInfo } from './models';

export interface CaseType {
  name: string;
  targetMinutes: number;
  count: number;
}

export type QueueItemStatus = 'pending' | 'done';

export interface QueueItem {
  id: string;
  typeName: string;
  targetMinutes: number;
  status: QueueItemStatus;
  stat?: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface ShiftSetup {
  shiftEnd: Date;
  caseTypes: CaseType[];
  breaks: BreakInfo[];
}

export interface TypeBreakdown {
  name: string;
  completed: number;
}

export interface ShiftRecord {
  id: string;
  date: string; // ISO date the shift was completed
  shiftEndTarget: string; // formatted target end time
  casesCompleted: number;
  totalCases: number;
  completionRate: number;
  avgPaceMinutes: number; // average actual minutes per case
  casesPerHour: number;
  totalMinutesWorked: number;
  byType: TypeBreakdown[];
}
