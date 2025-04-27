import { Component, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import { environment } from '../../../../../environments/environment';
import { CallapiService } from '../../service/callapi.service';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
interface BannerItem {
  id: any;
  title: string;
  link: string;
  isActive: boolean;
}
@Component({
  selector: 'app-ads',
  standalone: false,
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.css',
})
export class AdsComponent implements OnDestroy {
  bannerItems: BannerItem[] = [];
  subscriptions: Subscription[] = [];

  modalMode: 'add' | 'edit' = 'add';
  currentBanner: BannerItem = {
    id: null,
    title: '',
    link: '',
    isActive: true,
  };

  constructor(private callApi: CallapiService) {
    this.getBannerItems();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getBannerItems(): void {
    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/get_banners`, {})
      .subscribe({
        next: (response) => {
          this.bannerItems = response.data || [];
        },
        error: (error) => {
          console.error('Error fetching banner items:', error);
          this.showAlert('Error', 'Failed to load banner items', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  openModal(mode: 'add' | 'edit', banner?: BannerItem): void {
    this.modalMode = mode;
    if (mode === 'edit' && banner) {
      this.currentBanner = { ...banner };
    } else {
      this.currentBanner = {
        id: null,
        title: '',
        link: '',
        isActive: true,
      };
    }

    const modal = new Modal(document.getElementById('bannerModal')!);
    modal.show();
  }

  saveBanner(form: NgForm): void {
    if (form.invalid) return;

    const data = {
      id: this.currentBanner.id,
      title: this.currentBanner.title,
      link: this.currentBanner.link,
      isActive: this.currentBanner.isActive,
    };

    if (this.modalMode === 'add') {
      this.callApi
        .postData(`${environment.API_BASE_URL}/admin/add_banner`, data)
        .subscribe({
          next: () => {
            this.getBannerItems();
            this.closeModal();
            this.showAlert('Success', 'Banner added successfully', 'success');
          },
          error: () => {
            this.showAlert('Error', 'Failed to add banner', 'error');
          },
        });
    } else {
      this.callApi
        .postData(`${environment.API_BASE_URL}/admin/update_banner`, data)
        .subscribe({
          next: () => {
            this.getBannerItems();
            this.closeModal();
            this.showAlert('Success', 'Banner updated successfully', 'success');
          },
          error: () => {
            this.showAlert('Error', 'Failed to update banner', 'error');
          },
        });
    }
  }

  deleteBanner(id: number): void {
    this.showConfirm(
      'Delete',
      'Are you sure you want to delete this banner?'
    ).then((result) => {
      if (result.isConfirmed) {
        const sub = this.callApi
          .deleteData(`${environment.API_BASE_URL}/admin/delete_banner`, id)
          .subscribe({
            next: () => {
              this.getBannerItems();
              this.showAlert(
                'Deleted',
                'Banner deleted successfully',
                'success'
              );
            },
            error: (error) => {
              console.error('Error deleting banner:', error);
              this.showAlert('Error', 'Failed to delete banner', 'error');
            },
          });
        this.subscriptions.push(sub);
      }
    });
  }

  toggleBannerStatus(id: number, currentStatus: boolean): void {
    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/toggle_banner_status`, {
        id,
        isActive: !currentStatus,
      })
      .subscribe({
        next: () => {
          this.getBannerItems();
          this.showAlert(
            'Success',
            `Banner ${
              currentStatus ? 'deactivated' : 'activated'
            } successfully`,
            'success'
          );
        },
        error: (error) => {
          console.error('Error toggling banner status:', error);
          this.showAlert('Error', 'Failed to update banner status', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  private closeModal(): void {
    const modal = Modal.getInstance(document.getElementById('bannerModal')!);
    modal?.hide();
  }

  private showAlert(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning' | 'info'
  ): void {
    Swal.fire({ title, text, icon, confirmButtonText: 'OK' });
  }

  private showConfirm(title: string, text: string): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    });
  }
}
