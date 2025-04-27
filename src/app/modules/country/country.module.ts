import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { CountryRoutingModule } from './country-routing.module';
import { CountryComponent } from './country.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [CountryComponent],
  imports: [CommonModule, CountryRoutingModule, FormsModule, NgbModule],
  providers: [provideHttpClient()],
})
export class CountryModule {}
