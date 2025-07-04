import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { BreakInfo } from '../../app.component';

@Component({
  selector: 'app-break',
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, MatIconModule, FormsModule, CommonModule, MatButtonModule],
  templateUrl: './break.component.html',
  styleUrl: './break.component.scss'
})
export class BreakComponent {
  @Input() breaks!: BreakInfo[];

  deleteBreak(i: number) {
    this.breaks.splice(i, 1);
  }

  confirmBreak(i: number) {
    this.breaks[i].confirmed = true;
  }
}
