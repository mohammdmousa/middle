import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { JobRoutingModule } from './job-routing.module';
import { JobComponent } from '../job/components/jobs/job.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { CustomFormComponent } from './components/custom-form/custom-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AllCategoriesComponent } from './components/all-categories/all-categories.component';
import { AddCategoryComponent } from './components/add-category/add-category.component';
import { AddAdvertisementsComponent } from './components/add-advertisements/add-advertisements.component';
import { DetilesAdvertisementsComponent } from './components/detiles-advertisements/detiles-advertisements.component';
import { AuctionsComponent } from './components/auctions/auctions.component';
import { AddauctionComponent } from './components/addauction/addauction.component';
import { RichTextEditorComponent } from './components/rich-text-editor/rich-text-editor.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { DetailsAcutionComponent } from './components/details-acution/details-acution.component';

@NgModule({
  declarations: [
    JobComponent,
    OpportunitiesComponent,
    StatisticsComponent,
    CustomFormComponent,
    AllCategoriesComponent,
    AddCategoryComponent,
    AddAdvertisementsComponent,
    DetilesAdvertisementsComponent,
    AuctionsComponent,
    AddauctionComponent,
    RichTextEditorComponent,
    DetailsAcutionComponent,
  ],
  imports: [
    CommonModule,
    JobRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    EditorModule,
  ],
})
export class JobModule {}
