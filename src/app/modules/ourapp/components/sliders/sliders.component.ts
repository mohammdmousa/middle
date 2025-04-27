import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import { environment } from '../../../../../environments/environment';
import { CallapiService } from '../../service/callapi.service';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
interface SliderItem {
  id?: number;
  mainTitle: string;
  subTitle: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  order: number;
}

@Component({
  selector: 'app-sliders',
  standalone: false,
  templateUrl: './sliders.component.html',
  styleUrl: './sliders.component.css',
})
export class SlidersComponent {
  sliderItems: any[] = [];
  subscriptions: Subscription[] = [];

  selectedFiles: File[] = [];

  modalMode: 'add' | 'edit' = 'add';
  currentSlider: any = {
    id: null,
    mainTitle: '',
    subTitle: '',
    imageUrl: [],
    link: '',
  };

  onFilesSelected(event: any): void {
    this.selectedFiles = event.target.files;
    const fileUrls: string[] = [];

    // عرض صور المعاينة
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        fileUrls.push(e.target.result);
        if (fileUrls.length === this.selectedFiles.length) {
          this.currentSlider.imageUrl = fileUrls;
        }
      };
      reader.readAsDataURL(this.selectedFiles[i]);
    }
  }

  saveSlider(form: NgForm): void {
    if (form.invalid) return;

    const formData = new FormData();
    formData.append('mainTitle', this.currentSlider.mainTitle);
    formData.append('subTitle', this.currentSlider.subTitle);
    formData.append('link', this.currentSlider.link);

    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append('image', this.selectedFiles[i]);
    }

    if (this.modalMode === 'add') {
      this.callApi
        .postData(`${environment.API_BASE_URL}/admin/add_slider`, formData)
        .subscribe({
          next: () => {
            this.getSliderItems();
            this.closeModal();
            this.showAlert('Success', 'Slider added successfully', 'success');
          },
          error: () => {
            this.showAlert('Error', 'Failed to add slider', 'error');
          },
        });
    } else {
      formData.append('id', this.currentSlider.id);
      this.callApi
        .postData(`${environment.API_BASE_URL}/admin/update_slider`, formData)
        .subscribe({
          next: () => {
            this.getSliderItems();
            this.closeModal();
            this.showAlert('Success', 'Slider updated successfully', 'success');
          },
          error: () => {
            this.showAlert('Error', 'Failed to update slider', 'error');
          },
        });
    }
  }

  // للتعامل مع رفع الملفات
  selectedFile: File | null = null;

  constructor(private callApi: CallapiService) {
    this.getSliderItems();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getSliderItems(): void {
    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/get_sliders`, {})
      .subscribe({
        next: (response) => {
          this.sliderItems = response.data || [];
        },
        error: (error) => {
          console.error('Error fetching slider items:', error);
          this.showAlert('Error', 'Failed to load slider items', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  openModal(mode: 'add' | 'edit', slider?: any): void {
    this.modalMode = mode;
    if (mode === 'edit' && slider) {
      this.currentSlider = { ...slider };
    } else {
      this.currentSlider = {
        id: null,
        mainTitle: '',
        subTitle: '',
        imageUrl: '',
        link: '',
        isActive: true,
        order: this.sliderItems.length + 1,
      };
    }
    this.selectedFile = null;

    const modal = new Modal(document.getElementById('sliderModal')!);
    modal.show();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      // عرض صورة معاينة قبل الرفع
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentSlider.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  previewImages: { file: File; url: string }[] = [];
  onImagesSelected(event: any): void {
    const files: FileList = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.previewImages.push({
          file: file,
          url: e.target.result,
        });
      };

      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
  }
  deleteSlider(id: number): void {
    this.showConfirm(
      'Delete',
      'Are you sure you want to delete this slider?'
    ).then((result) => {
      if (result.isConfirmed) {
        const sub = this.callApi
          .deleteData(`${environment.API_BASE_URL}/admin/delete_slider`, id)
          .subscribe({
            next: () => {
              this.getSliderItems();
              this.showAlert(
                'Deleted',
                'Slider deleted successfully',
                'success'
              );
            },
            error: (error) => {
              console.error('Error deleting slider:', error);
              this.showAlert('Error', 'Failed to delete slider', 'error');
            },
          });
        this.subscriptions.push(sub);
      }
    });
  }

  toggleSliderStatus(id: number, currentStatus: boolean): void {
    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/toggle_slider_status`, {
        id,
        isActive: !currentStatus,
      })
      .subscribe({
        next: () => {
          this.getSliderItems();
          this.showAlert(
            'Success',
            `Slider ${
              currentStatus ? 'deactivated' : 'activated'
            } successfully`,
            'success'
          );
        },
        error: (error) => {
          console.error('Error toggling slider status:', error);
          this.showAlert('Error', 'Failed to update slider status', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  private closeModal(): void {
    const modal = Modal.getInstance(document.getElementById('sliderModal')!);
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
