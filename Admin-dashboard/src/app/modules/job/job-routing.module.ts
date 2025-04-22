import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobComponent } from '../job/components/jobs/job.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { CustomFormComponent } from './components/custom-form/custom-form.component';
import { AddCategoryComponent } from './components/add-category/add-category.component';
import { AllCategoriesComponent } from './components/all-categories/all-categories.component';
import { AddAdvertisementsComponent } from './components/add-advertisements/add-advertisements.component';
import { DetilesAdvertisementsComponent } from './components/detiles-advertisements/detiles-advertisements.component';
import { AuctionsComponent } from './components/auctions/auctions.component';
import { AddauctionComponent } from './components/addauction/addauction.component';
import { DetailsAcutionComponent } from './components/details-acution/details-acution.component';

const routes: Routes = [
  { path: '', component: JobComponent },
  { path: 'Opportunities', component: OpportunitiesComponent },
  { path: 'statistic', component: StatisticsComponent },
  { path: 'Custom', component: CustomFormComponent },
  { path: 'AddCategory', component: AddCategoryComponent },
  { path: 'AllCategories', component: AllCategoriesComponent },
  { path: 'addAd', component: AddAdvertisementsComponent },
  { path: 'detilesAd/:id', component: DetilesAdvertisementsComponent },
  { path: 'auctions', component: AuctionsComponent },
  { path: 'addauction', component: AddauctionComponent },
  { path: 'details/:id', component: DetailsAcutionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JobRoutingModule {}
