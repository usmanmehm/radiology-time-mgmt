import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkingSessionService {

  showWarning = false;
  showDanger = false;

  timeLeft!: string;
  timeLeftPercentage = 100;
  casesLeftPercentage = 0;
  casesLeftText = ''

  constructor() { }
}
