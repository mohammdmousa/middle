import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OurappRoutingModule } from './ourapp-routing.module';
import { ContactusComponent } from './components/contactus/contactus.component';
import { SlidersComponent } from './components/sliders/sliders.component';
import { AdsComponent } from './components/ads/ads.component';

@NgModule({
  declarations: [ContactusComponent, SlidersComponent, AdsComponent],
  imports: [CommonModule, OurappRoutingModule, FormsModule],
})
export class OurappModule {}
