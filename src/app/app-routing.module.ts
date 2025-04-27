import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashComponent } from './Globle/dash/dash.component';
import { LoginComponent } from './Globle/login/login.component';
import { AuthGuard } from './core/Guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dash',
    component: DashComponent,
    // canActivate: [AuthGuard],
    children: [
      {
        path: 'country',
        loadChildren: () =>
          import('./modules/country/country.module').then(
            (m) => m.CountryModule
          ),
      },
      {
        path: 'job',
        loadChildren: () =>
          import('./modules/job/job.module').then((m) => m.JobModule),
      },
      {
        path: 'enduser',
        loadChildren: () =>
          import('./modules/end-users/end-users.module').then(
            (m) => m.EndUsersModule
          ),
      },
      {
        path: 'notification',
        loadChildren: () =>
          import('./modules/notification/notification.module').then(
            (m) => m.NotificationModule
          ),
      },
      {
        path: 'ourapp',
        loadChildren: () =>
          import('./modules/ourapp/ourapp.module').then((m) => m.OurappModule),
      },
      {
        path: 'statistics',
        loadChildren: () =>
          import('./modules/statistics/statistics.module').then(
            (m) => m.StatisticsModule
          ),
      },
    ],
  },

  {
    path: '**',
    redirectTo: '/login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
