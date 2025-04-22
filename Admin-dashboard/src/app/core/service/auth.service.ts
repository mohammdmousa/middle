import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private httpClient: HttpClient, private router: Router) {}
  authApi: string = `${environment.API_BASE_URL}/all/login`;
  login(data: any): Observable<any> {
    return this.httpClient.post(this.authApi, data).pipe(
      tap((response: any) => {
        if (response.access_token) {
          sessionStorage.setItem('auth_token', response.access_token);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return sessionStorage.getItem('auth_token');
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
  pushData(api: string, data: any): Observable<any> {
    const headers = this.createHeaders();
    return this.httpClient
      .post(api, data, { headers })
      .pipe(catchError(this.handleError));
  }

  // إنشاء الهيدرات مع التوكن
  private createHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    headers = headers.set('Content-Type', 'application/json');

    return headers;
  }
  handleError(error: HttpErrorResponse) {
    if (error.status == 401) {
      this.logout();
    }
    return throwError(() => error);
  }
}
