import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { CallapiService } from '../../service/callapi.service';
import { AuthService } from '../../../../core/service/auth.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-documentation-requests',
  standalone: false,
  templateUrl: './documentation-requests.component.html',
  styleUrl: './documentation-requests.component.css',
})
export class DocumentationRequestsComponent implements OnInit {
  url: string = environment.url;
  requests: any[] = [];

  constructor(private callApi: CallapiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadVerificationRequests();
  }

  loadVerificationRequests(): void {
    this.callApi
      .getData(`${environment.API_BASE_URL}/admin/verification-requests`)
      .subscribe({
        next: (response) => {
          this.requests = response.data;
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في تحميل طلبات التوثيق', 'error');
        },
      });
  }

  approveRequest(requestId: number): void {
    this.showConfirm(
      'هل أنت متأكد؟',
      'سيتم منح المستخدم علامة التوثيق الزرقاء'
    ).then((result) => {
      if (result.isConfirmed) {
        this.callApi
          .postData(
            `${environment.API_BASE_URL}/admin/approve-verification/${requestId}`,
            {}
          )
          .subscribe({
            next: () => {
              this.showAlert(
                'تم بنجاح',
                'تم قبول طلب التوثيق بنجاح',
                'success'
              );
              this.loadVerificationRequests();
            },
            error: (error) => {
              this.showAlert('خطأ', 'فشل في قبول طلب التوثيق', 'error');
            },
          });
      }
    });
  }

  rejectRequest(requestId: number): void {
    this.showConfirm('هل أنت متأكد؟', 'سيتم رفض طلب التوثيق').then((result) => {
      if (result.isConfirmed) {
        this.callApi
          .postData(
            `${environment.API_BASE_URL}/admin/reject-verification/${requestId}`,
            {}
          )
          .subscribe({
            next: () => {
              this.showAlert('تم بنجاح', 'تم رفض طلب التوثيق بنجاح', 'success');
              this.loadVerificationRequests();
            },
            error: (error) => {
              this.showAlert('خطأ', 'فشل في رفض طلب التوثيق', 'error');
            },
          });
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: any = {
      pending: 'قيد الانتظار',
      approved: 'مقبول',
      rejected: 'مرفوض',
    };
    return statusMap[status] || status;
  }

  private showAlert(title: string, text: string, icon: any): void {
    Swal.fire({ title, text, icon, confirmButtonText: 'حسناً' });
  }

  private showConfirm(title: string, text: string): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم، متأكد',
      cancelButtonText: 'إلغاء',
    });
  }
}
