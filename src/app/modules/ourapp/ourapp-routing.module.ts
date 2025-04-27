import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactusComponent } from './components/contactus/contactus.component';
import { AdsComponent } from './components/ads/ads.component';
import { SlidersComponent } from './components/sliders/sliders.component';

const routes: Routes = [
  { path: '', component: ContactusComponent },
  { path: 'ads', component: AdsComponent },
  { path: 'sliders', component: SlidersComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OurappRoutingModule {}
