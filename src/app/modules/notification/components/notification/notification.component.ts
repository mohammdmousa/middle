import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/service/auth.service';
import { CallapiService } from '../../service/callapi.service';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notification',
  standalone: false,
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
})
export class NotificationComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  notification = {
    recipientsType: 'user',
    selectedRecipients: [] as any[],
    title: '',
    content: '',
  };

  realTimeNotifications: any[] = [];
  users: any[] = [];
  companies: any[] = [];
  filteredUsers: any[] = [];
  filteredCompanies: any[] = [];
  selectedTab: 'user' | 'companie' = 'user';

  // متغيرات التقسيم الصفحي
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  lastPage = 1;
  searchTerm: string = '';

  constructor(private auth: AuthService, private callApi: CallapiService) {}

  ngOnInit(): void {
    this.getUsers();
    this.getCompanies();
    this.setupNotificationListener();
    this.requestNotificationPermission();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private requestNotificationPermission() {
    const userId = this.auth.getUserId();
    console.log('User ID:', userId); // إضافة هذا السطر للتحقق
    if (userId) {
      this.callApi.requestPermission(userId).subscribe({
        next: () => console.log('Notification permission granted'),
        error: (err) => console.error('Permission error:', err),
      });
    } else {
      console.warn('No user ID found'); // إضافة تحذير إذا لم يتم العثور على ID
    }
  }

  private setupNotificationListener() {
    const sub = this.callApi.listenForMessages().subscribe((payload: any) => {
      this.realTimeNotifications.unshift({
        title: payload.notification.title,
        content: payload.notification.body,
        created_at: new Date(),
      });
      this.showRealTimeNotification(payload.notification);
    });
    this.subscriptions.push(sub);
  }

  private showRealTimeNotification(notification: any): void {
    Swal.fire({
      title: notification.title,
      text: notification.body,
      icon: 'info',
      confirmButtonText: 'OK',
    });
  }

  // باقي الدوال كما هي...
  getUsers(page: number = 1): void {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/users?page=${page}`)
      .subscribe({
        next: (data) => {
          this.users = data.users.data;
          this.filteredUsers = [...this.users];
          this.currentPage = data.users.current_page;
          this.itemsPerPage = data.users.per_page;
          this.totalItems = data.users.total;
          this.lastPage = data.users.last_page;
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to fetch users', 'error');
        },
      });
    this.subscriptions.push(subscribe);
  }

  getCompanies(): void {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/companies`)
      .subscribe({
        next: (data) => {
          this.companies = data.companies;
          this.filteredCompanies = [...this.companies];
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to fetch companies', 'error');
        },
      });
    this.subscriptions.push(subscribe);
  }

  sendNotification(): void {
    if (!this.validateNotification()) return;

    const payload = {
      recipients: this.notification.selectedRecipients.map((r: any) => r.id),
      title: this.notification.title,
      body: this.notification.content,
      type: this.notification.recipientsType,
    };
    console.log(payload);
    const subscribe = this.callApi.sendNotification(payload).subscribe({
      next: () => {
        this.showAlert('Success', 'Notification sent successfully', 'success');
        this.resetForm();
      },
      error: (error) => {
        this.auth.handleError(error);
        this.showAlert('Error', 'Failed to send notification', 'error');
      },
    });
    this.subscriptions.push(subscribe);
  }

  // باقي الدوال المساعدة...
  private validateNotification(): boolean {
    if (!this.notification.title || !this.notification.content) {
      this.showAlert('Error', 'Title and content are required', 'error');
      return false;
    }

    if (this.notification.selectedRecipients.length === 0) {
      this.showAlert('Error', 'Please select at least one recipient', 'error');
      return false;
    }

    return true;
  }

  private showAlert(
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ): void {
    Swal.fire({
      title,
      text: message,
      icon: type,
      confirmButtonText: 'OK',
    });
  }

  resetForm(): void {
    this.notification = {
      recipientsType: 'user',
      selectedRecipients: [],
      title: '',
      content: '',
    };
    this.selectedTab = 'user';
    this.searchTerm = '';
    this.filterItems();
  }

  filterItems(): void {
    if (this.selectedTab === 'user') {
      this.filteredUsers = this.users.filter(
        (item) =>
          item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (item.email &&
            item.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    } else {
      this.filteredCompanies = this.companies.filter(
        (item) =>
          item.en_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (item.email &&
            item.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterItems();
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.lastPage }, (_, i) => i + 1);
  }

  toggleRecipientSelection(recipient: any): void {
    const index = this.notification.selectedRecipients.findIndex(
      (r) => r.id === recipient.id
    );

    if (index === -1) {
      this.notification.selectedRecipients.push(recipient);
    } else {
      this.notification.selectedRecipients.splice(index, 1);
    }
  }

  isSelected(recipient: any): boolean {
    return this.notification.selectedRecipients.some(
      (r) => r.id === recipient.id
    );
  }

  removeRecipient(index: number): void {
    this.notification.selectedRecipients.splice(index, 1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.getUsers(page);
    }
  }
}
