import { Routes } from '@angular/router';
import { ClassicWorkspaceComponent } from './components/classic-workspace/classic-workspace.component';
import { ProShellComponent } from './components/pro-shell/pro-shell.component';

export const routes: Routes = [
  { path: '', component: ClassicWorkspaceComponent },
  { path: 'pro', component: ProShellComponent },
  { path: '**', redirectTo: '' }
];
