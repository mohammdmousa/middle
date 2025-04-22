import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NotificationRoutingModule } from './notification-routing.module';
import { NotificationComponent } from './components/notification/notification.component';

@NgModule({
  declarations: [NotificationComponent],
  imports: [CommonModule, NotificationRoutingModule, FormsModule],
})
export class NotificationModule {}
