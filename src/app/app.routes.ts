import { Routes } from '@angular/router';
import { ClassicWorkspaceComponent } from './components/classic-workspace/classic-workspace.component';
import { InsightsShellComponent } from './components/insights-shell/insights-shell.component';

export const routes: Routes = [
  { path: '', component: ClassicWorkspaceComponent },
  { path: 'insights', component: InsightsShellComponent },
  { path: '**', redirectTo: '' }
];
