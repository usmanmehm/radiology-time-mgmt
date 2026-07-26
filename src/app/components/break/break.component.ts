import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { BreakInfo } from '../../models';

@Component({
  selector: 'app-break',
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, MatIconModule, FormsModule, CommonModule, MatButtonModule],
  templateUrl: './break.component.html',
  styleUrl: './break.component.scss'
})
export class BreakComponent {
  @Input() breaks!: BreakInfo[];
  /** Breaks must end at or before this time (e.g. the session/shift end). */
  @Input() maxTime?: Date;

  deleteBreak(i: number) {
    this.breaks.splice(i, 1);
  }

  confirmBreak(i: number) {
    if (this.validationError(i)) return;
    this.breaks[i].confirmed = true;
  }

  validationError(i: number): string | null {
    const current = this.breaks[i];
    const start = new Date(current.start).getTime();
    const end = new Date(current.end).getTime();

    if (end <= start) {
      return 'End time must be after the start time.';
    }

    if (this.maxTime && end > new Date(this.maxTime).getTime()) {
      return 'Break must end before the session ends.';
    }

    const overlaps = this.breaks.some((other, j) => {
      if (j === i) return false;
      const otherStart = new Date(other.start).getTime();
      const otherEnd = new Date(other.end).getTime();
      return start < otherEnd && end > otherStart;
    });

    if (overlaps) {
      return 'This break overlaps with another break.';
    }

    return null;
  }
}
