import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkingSessionService {

  showWarning = false;
  showDanger = false;
  negativeTime = false;

  timeLeft!: string;
  timeLeftPercentage = 100;
  casesLeftPercentage = 0;
  casesLeftText = ''
  timePerCase = '';

  constructor() { }
}
