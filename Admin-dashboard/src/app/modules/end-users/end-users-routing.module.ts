import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersComponent } from './components/users/users.component';
import { CompaniesComponent } from './components/companies/companies.component';
import { DocumentationRequestsComponent } from './components/documentation-requests/documentation-requests.component';

const routes: Routes = [
  { path: '', component: UsersComponent },
  { path: 'company', component: CompaniesComponent },
  { path: 'requst', component: DocumentationRequestsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EndUsersRoutingModule {}
