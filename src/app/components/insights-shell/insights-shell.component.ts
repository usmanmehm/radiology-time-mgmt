import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightsShiftService } from '../../services/insights-shift.service';
import { InsightsSetupComponent } from '../insights-setup/insights-setup.component';
import { InsightsLiveComponent } from '../insights-live/insights-live.component';
import { InsightsHistoryComponent } from '../insights-history/insights-history.component';

type InsightsView = 'setup' | 'live' | 'history';

@Component({
  selector: 'app-insights-shell',
  imports: [CommonModule, InsightsSetupComponent, InsightsLiveComponent, InsightsHistoryComponent],
  templateUrl: './insights-shell.component.html',
  styleUrl: './insights-shell.component.scss'
})
export class InsightsShellComponent {
  view: InsightsView;

  constructor(public shiftService: InsightsShiftService) {
    this.view = this.shiftService.shiftActive ? 'live' : 'setup';
  }

  goTo(view: InsightsView) {
    this.view = view;
  }

  onShiftStarted() {
    this.view = 'live';
  }

  onShiftEnded() {
    this.view = 'history';
  }
}
