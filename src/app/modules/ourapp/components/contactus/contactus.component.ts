import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { CallapiService } from '../../service/callapi.service';
import { environment } from '../../../../../environments/environment';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-contactus',
  standalone: false,
  templateUrl: './contactus.component.html',
  styleUrl: './contactus.component.css',
})
export class ContactusComponent {
  contactInfoListt = [
    {
      id: 1,
      type: 'phone',
      value: '+1 234 567 890',
      isPrimary: true,
    },
    {
      id: 2,
      type: 'email',
      value: 'example@email.com',
      isPrimary: false,
    },
    {
      id: 3,
      type: 'facebook',
      value: 'https://facebook.com/example',
      isPrimary: false,
    },
    {
      id: 4,
      type: 'twitter',
      value: 'https://twitter.com/example',
      isPrimary: false,
    },
    {
      id: 5,
      type: 'instagram',
      value: 'https://instagram.com/example',
      isPrimary: false,
    },
    {
      id: 6,
      type: 'whatsapp',
      value: '+1 987 654 321',
      isPrimary: false,
    },
    {
      id: 7,
      type: 'website',
      value: 'https://www.example.com',
      isPrimary: true,
    },
    {
      id: 8,
      type: 'other',
      value: 'Custom Contact Info',
      isPrimary: false,
    },
  ];

  contactInfoList: any[] = [];
  subscriptions: Subscription[] = [];

  modalMode: 'add' | 'edit' = 'add'; // add or edit
  currentContact: any = {
    id: null,
    type: '',
    value: '',
  };

  constructor(private callApi: CallapiService) {
    this.getContactInfo();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getContactInfo(): void {
    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/get_contact_info`, {})
      .subscribe({
        next: (response) => {
          this.contactInfoList = response.data;
        },
        error: (error) => {
          console.error('Error fetching contact info:', error);
        },
      });
    this.subscriptions.push(sub);
  }

  openModal(mode: 'add' | 'edit', contact?: any): void {
    this.modalMode = mode;
    if (mode === 'edit' && contact) {
      this.currentContact = { ...contact };
    } else {
      this.currentContact = { id: null, type: '', value: '' };
    }

    const modal = new Modal(document.getElementById('contactModal')!);
    modal.show();
  }

  saveContactInfo(): void {
    if (!this.currentContact.type || !this.currentContact.value) return;

    if (this.modalMode === 'add') {
      const sub = this.callApi
        .postData(
          `${environment.API_BASE_URL}/admin/add_contact_info`,
          this.currentContact
        )
        .subscribe({
          next: () => {
            this.getContactInfo();
            this.closeModal();
            this.showAlert(
              'Success',
              'Contact info added successfully',
              'success'
            );
          },
          error: () => {
            this.showAlert('Error', 'Failed to add contact info', 'error');
          },
        });
      this.subscriptions.push(sub);
    } else {
      const sub = this.callApi
        .postData(
          `${environment.API_BASE_URL}/admin/update_contact_info`,
          this.currentContact
        )
        .subscribe({
          next: () => {
            this.getContactInfo();
            this.closeModal();
            this.showAlert(
              'Success',
              'Contact info updated successfully',
              'success'
            );
          },
          error: () => {
            this.showAlert('Error', 'Failed to update contact info', 'error');
          },
        });
      this.subscriptions.push(sub);
    }
  }

  deleteContactInfo(id: number): void {
    this.showConfirm(
      'Delete',
      'Are you sure you want to delete this contact info?'
    ).then((result) => {
      if (result.isConfirmed) {
        const sub = this.callApi
          .deleteData(
            `${environment.API_BASE_URL}/admin/delete_contact_info`,
            id
          )
          .subscribe({
            next: () => {
              this.getContactInfo();
              this.showAlert(
                'Deleted',
                'Contact info deleted successfully',
                'success'
              );
            },
            error: () => {
              this.showAlert('Error', 'Failed to delete contact info', 'error');
            },
          });
        this.subscriptions.push(sub);
      }
    });
  }

  getIconClass(type: string): string {
    const icons: { [key: string]: string } = {
      phone: 'fas fa-phone',
      email: 'fas fa-envelope',
      facebook: 'fab fa-facebook-f',
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      linkedin: 'fab fa-linkedin-in',
      whatsapp: 'fab fa-whatsapp',
      website: 'fas fa-globe',
      other: 'fas fa-link',
    };
    return icons[type] || 'fas fa-question';
  }

  private closeModal(): void {
    const modal = Modal.getInstance(document.getElementById('contactModal')!);
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
