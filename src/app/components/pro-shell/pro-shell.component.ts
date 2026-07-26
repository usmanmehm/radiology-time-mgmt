import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProShiftService } from '../../services/pro-shift.service';
import { ProSetupComponent } from '../pro-setup/pro-setup.component';
import { ProLiveComponent } from '../pro-live/pro-live.component';
import { ProHistoryComponent } from '../pro-history/pro-history.component';

type ProView = 'setup' | 'live' | 'history';

@Component({
  selector: 'app-pro-shell',
  imports: [CommonModule, ProSetupComponent, ProLiveComponent, ProHistoryComponent],
  templateUrl: './pro-shell.component.html',
  styleUrl: './pro-shell.component.scss'
})
export class ProShellComponent {
  view: ProView;

  constructor(public shiftService: ProShiftService) {
    this.view = this.shiftService.shiftActive ? 'live' : 'setup';
  }

  goTo(view: ProView) {
    this.view = view;
  }

  onShiftStarted() {
    this.view = 'live';
  }

  onShiftEnded() {
    this.view = 'history';
  }
}
