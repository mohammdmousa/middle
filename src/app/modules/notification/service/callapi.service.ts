import { Injectable } from '@angular/core';
import { AuthService } from '../../../core/service/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, mergeMap, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

@Injectable({
  providedIn: 'root',
})
export class CallapiService {
  constructor(
    private auth: AuthService,
    private httpClient: HttpClient,
    private afMessaging: AngularFireMessaging
  ) {}

  // طلب إذن الإشعارات وحفظ التوكن
  requestPermission(userId: string) {
    return this.afMessaging.requestToken.pipe(
      mergeMap((token) => {
        console.log(token);
        return this.httpClient.post(`${environment.API_BASE_URL}/save-token`, {
          userId,
          token,
        });
      })
    );
  }

  // الاستماع للإشعارات الواردة
  listenForMessages() {
    return this.afMessaging.messages;
  }

  // إرسال إشعار
  sendNotification(payload: {
    recipients: string[];
    title: string;
    body: string;
    type: string;
  }): Observable<any> {
    return this.httpClient.post(
      `${environment.API_BASE_URL}/send_notification`,
      payload
    );
  }

  // باقي الدوال كما هي...
  getData(api: string): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient.post(api, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred:', error);
        return throwError(() => error);
      })
    );
  }

  postData(api: string, data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient.post(api, data, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred while posting data:', error);
        return throwError(() => error);
      })
    );
  }

  updateData(api: string, data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient.put(api, data, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred while updating data:', error);
        return throwError(() => error);
      })
    );
  }

  deleteData(api: string, id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient.delete(`${api}/${id}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error occurred while deleting data:', error);
        return throwError(() => error);
      })
    );
  }

  private createHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
