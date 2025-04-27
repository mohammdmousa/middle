import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EndUsersRoutingModule } from './end-users-routing.module';
import { UsersComponent } from './components/users/users.component';
import { CompaniesComponent } from './components/companies/companies.component';

@NgModule({
  declarations: [UsersComponent, CompaniesComponent],
  imports: [CommonModule, EndUsersRoutingModule, FormsModule],
})
export class EndUsersModule {}
