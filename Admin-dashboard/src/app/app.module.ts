import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './Globle/login/login.component';
import { DashComponent } from './Globle/dash/dash.component';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http'; // استيراد provideHttpClient
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [AppComponent, LoginComponent, DashComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, NgbModule],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule {}
