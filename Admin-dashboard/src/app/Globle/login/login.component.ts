import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private router: Router, private aouth: AuthService) {}
  errors: { email?: string; password?: string } = {};
  onSubmit(form: any) {
    if (form.valid) {
      this.aouth
        .login({
          email: form.value.email,
          password: form.value.password,
        })
        .subscribe({
          next: (res: any) => {
            this.router.navigate(['/dash/country']);
          },
          error: (err: any) => {
            Swal.fire({
              title: 'error',
              text: 'Some Thing Is Wrong',
              icon: 'error',
            });
            console.error('Login failed', err);
            const errorResponse = err.error;
            this.errors = {
              email: errorResponse?.email?.[0] || null,
              password: errorResponse?.password?.[0] || null,
            };
          },
        });
    } else {
      console.error('Form is invalid');
    }
  }
}
