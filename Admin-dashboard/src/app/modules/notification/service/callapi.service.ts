import { Injectable } from '@angular/core';
import { AuthService } from '../../../core/service/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root',
})
export class CallapiService {
  private pusher: Pusher;
  channel: any;
  constructor(private aouth: AuthService, private httpClient: HttpClient) {
    this.pusher = new Pusher(environment.pusher.key, {
      cluster: environment.pusher.cluster,
      forceTLS: true, // استخدام TLS بدلاً من encrypted
    });
  }
  subscribeToChannel(channelName: string): any {
    this.channel = this.pusher.subscribe(channelName);
    return this.channel;
  }

  disconnectPusher(): void {
    if (this.pusher) {
      this.pusher.disconnect();
    }
  }

  sendNotification(notificationData: any): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient
      .post(
        `${environment.API_BASE_URL}/admin/notifications`, // استخدام المسار الكامل
        notificationData,
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error('Error sending notification:', error);
          return throwError(() => error);
        })
      );
  }
  getData(api: string): Observable<any> {
    const headers = this.createHeaders();

    if (!headers || headers.keys().length === 0) {
      console.error('Headers are not set correctly');
      return throwError(() => 'Headers are not set correctly');
    }

    return this.httpClient.post(api, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred:', error);
        return throwError(() => error);
      })
    );
  }

  // دالة لإرسال البيانات (POST)
  postData(api: string, data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient.post(api, data, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred while posting data:', error);
        return throwError(() => error);
      })
    );
  }

  // دالة لتحديث البيانات (PUT)
  updateData(api: string, data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient.post(api, data, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred while updating data:', error);
        return throwError(() => error);
      })
    );
  }

  // دالة لحذف البيانات (DELETE)
  deleteData(api: string, id: number): Observable<any> {
    const headers = this.createHeaders();
    const body = { id }; // إرسال ID في الـ Body
    return this.httpClient.post(api, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred while deleting data:', error);
        return throwError(() => error);
      })
    );
  }

  // إنشاء الهيدرات مع التوكن
  private createHeaders(): HttpHeaders {
    const token = this.aouth.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
