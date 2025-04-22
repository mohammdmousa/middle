import { Component } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Subscription } from 'rxjs';
import { CallapiService } from '../../service/callapi.service';
import { AuthService } from '../../../../core/service/auth.service';
import { Modal } from 'bootstrap';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  constructor(private callApi: CallapiService, private auth: AuthService) {}
  Subscription: Subscription[] = [];
  url: string = environment.url;
  users: any[] = [];
  filteredUsers: any[] = [];
  countries: any[] = [];
  cities: any[] = [];
  searchTerm: string = '';

  // Pagination properties from server
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  lastPage: number = 1;
  firstPageUrl: string | null = null;
  lastPageUrl: string | null = null;
  nextPageUrl: string | null = null;
  prevPageUrl: string | null = null;
  links: any[] = [];

  // For adding new user
  newUser = {
    name: '',
    email: '',
    password: '',
    gender: 'male', // تعيين قيمة افتراضية
    birthday: '',
    country_id: null as number | null,
    region_id: null as number | null,
    photo: null as File | null,
    // status: 'active',
  };
  // For editing user
  editUser = {
    id: null as number | null,
    name: '',
    email: '',
    password: '',
    gender: 'male', // تعيين قيمة افتراضية
    birthday: '',
    country_id: null as number | null,
    region_id: null as number | null,
    photo: null as File | null,
    currentAvatar: '',
    // status: 'active',
  };

  ngOnInit(): void {
    this.getUsers();
    this.getCountries();
  }
  isNumericLink(link: any): boolean {
    // نريد فقط عرض الروابط العددية (1, 2, 3...) وليس "السابق" أو "التالي"
    return (
      !isNaN(Number(link.label)) &&
      link.label !== '&laquo; Previous' &&
      link.label !== 'Next &raquo;'
    );
  }
  getCountries(): void {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/countries`)
      .subscribe({
        next: (data) => {
          this.countries = data.countries;
          // للتأكد من البيانات

          // إذا كان هناك بلد محدد مسبقاً (في حالة التعديل)
          if (this.editUser.country_id) {
            this.onCountryChange(this.editUser.country_id, true);
          }
        },
        error: (error) => {
          this.auth.handleError(error);
        },
      });
    this.Subscription.push(subscribe);
  }

  onCountryChange(countryId: number | null, isEdit: boolean = false): void {
    if (countryId === null) {
      if (isEdit) {
        this.editUser.country_id = null;
        this.editUser.region_id = null;
      } else {
        this.newUser.country_id = null;
        this.newUser.region_id = null;
      }
      this.cities = [];
      return;
    }

    // البحث عن البلد المحدد في مصفوفة الدول
    const selectedCountry = this.countries.find((c) => c.id == countryId);

    if (selectedCountry) {
      // افترض أن المدن تأتي مع بيانات الدولة في خاصية cities أو regions
      this.cities = selectedCountry.regions;

      // إذا كان هناك مدينة واحدة فقط، حددها
      if (this.cities.length === 1) {
        if (isEdit) {
          this.editUser.region_id = this.cities[0].id;
        } else {
          this.newUser.region_id = this.cities[0].id;
        }
      }
    } else {
      this.cities = [];
    }
  }

  getUsers(page: number = 1): void {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/users?page=${page}`)
      .subscribe({
        next: (data) => {
          this.users = data.users.data;
          this.filteredUsers = [...this.users];

          // تحديث خصائص الباجينيشين من السيرفر
          this.currentPage = data.users.current_page;
          this.itemsPerPage = data.users.per_page;
          this.totalItems = data.users.total;
          this.lastPage = data.users.last_page;
          this.firstPageUrl = data.users.first_page_url;
          this.lastPageUrl = data.users.last_page_url;
          this.nextPageUrl = data.users.next_page_url;
          this.prevPageUrl = data.users.prev_page_url;
          this.links = data.users.links;
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في جلب بيانات المستخدمين', 'error');
        },
      });
    this.Subscription.push(subscribe);
  }

  openAddUserModal(): void {
    this.newUser = {
      name: '',
      email: '',
      password: '',
      gender: 'male', // تعيين قيمة افتراضية
      birthday: '',
      country_id: null,
      region_id: null,
      photo: null,
      // status: 'active',
    };
    this.cities = [];
    const modalEl = document.getElementById('addUserModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  openEditUserModal(user: any): void {
    this.editUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      gender: user.gender || 'male', // استخدام القيمة الحالية أو الافتراضية
      birthday: user.birthday,
      country_id: user.country_id,
      region_id: user.region_id,
      photo: user.photo,
      currentAvatar: user.photo || '',
      // status: user.status,
    };

    if (user.country_id) {
      this.onCountryChange(user.country_id, true);
    }

    const modalEl = document.getElementById('editUserModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  onAvatarSelected(event: any): void {
    this.newUser.photo = event.target.files[0];
  }

  onEditAvatarSelected(event: any): void {
    this.editUser.photo = event.target.files[0];
  }

  addUser(form: NgForm): void {
    if (form.invalid) return;

    const formData = new FormData();
    formData.append('name', this.newUser.name);
    formData.append('email', this.newUser.email);
    formData.append('password', this.newUser.password);
    formData.append('gender', this.newUser.gender);
    if (this.newUser.birthday) {
      formData.append('birthday', this.newUser.birthday);
    }
    if (this.newUser.country_id) {
      formData.append('country_id', this.newUser.country_id.toString());
    }
    if (this.newUser.region_id) {
      formData.append('region_id', this.newUser.region_id.toString());
    }
    if (this.newUser.photo) {
      formData.append('photo', this.newUser.photo, this.newUser.photo.name);
    }
    // formData.append('status', this.newUser.status);

    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_user`, formData)
      .subscribe({
        next: () => {
          this.closeModal('addUserModal');
          this.getUsers();
          this.showAlert('نجاح', 'تمت إضافة المستخدم بنجاح', 'success');
        },
        error: (error) => {
          this.showAlert('خطأ', 'فشل في إضافة المستخدم', 'error');
        },
      });
  }

  saveEditUser(form: NgForm): void {
    if (form.invalid || !this.editUser.id) return;

    const formData = new FormData();
    formData.append('id', this.editUser.id.toString());
    formData.append('name', this.editUser.name);
    formData.append('email', this.editUser.email);

    if (this.editUser.password) {
      formData.append('password', this.editUser.password);
    }

    // تأكد من إرسال قيمة الجنس حتى لو كانت فارغة
    formData.append('gender', this.editUser.gender || '');

    if (this.editUser.birthday) {
      formData.append('birthday', this.editUser.birthday);
    }

    if (this.editUser.country_id) {
      formData.append('country_id', this.editUser.country_id.toString());
    }

    if (this.editUser.region_id) {
      formData.append('region_id', this.editUser.region_id.toString());
    }

    // معالجة حقل الصورة بشكل صحيح
    if (this.editUser.photo instanceof File) {
      formData.append('photo', this.editUser.photo, this.editUser.photo.name);
    } else {
      // طلب حذف الصورة
      formData.append('photo', '');
    }
    this.callApi
      .updateData(`${environment.API_BASE_URL}/admin/update_user`, formData)
      .subscribe({
        next: () => {
          this.closeModal('editUserModal');
          this.getUsers();
          this.showAlert('نجاح', 'تم تحديث بيانات المستخدم بنجاح', 'success');
        },
        error: (error) => {
          console.error('Error details:', error);
          this.showAlert('خطأ', 'فشل في تحديث بيانات المستخدم', 'error');
        },
      });
  }

  deleteUser(id: number): void {
    this.showConfirm('هل أنت متأكد؟', 'سيتم حذف المستخدم بشكل دائم').then(
      (result) => {
        if (result.isConfirmed) {
          this.callApi
            .deleteData(`${environment.API_BASE_URL}/admin/delete_user`, id)
            .subscribe({
              next: () => {
                this.users = this.users.filter((user) => user.id !== id);
                this.filteredUsers = [...this.users];
                this.showAlert('نجاح', 'تم حذف المستخدم بنجاح', 'success');
              },
              error: (error) => {
                this.showAlert('خطأ', 'فشل في حذف المستخدم', 'error');
              },
            });
        }
      }
    );
  }

  // toggleUserStatus(id: number): void {
  //   const user = this.users.find((u) => u.id === id);
  //   if (user) {
  //     user.status = user.status === 'active' ? 'inactive' : 'active';

  //     const formData = new FormData();
  //     formData.append('id', user.id.toString());
  //     formData.append('name', user.name);
  //     formData.append('email', user.email);
  //     formData.append('gender', user.gender);
  //     if (user.birth_date) {
  //       formData.append('birth_date', user.birth_date);
  //     }
  //     if (user.country_id) {
  //       formData.append('country_id', user.country_id.toString());
  //     }
  //     if (user.city_id) {
  //       formData.append('city_id', user.city_id.toString());
  //     }
  //     formData.append('status', user.status);

  //     this.callApi
  //       .updateData(`${environment.API_BASE_URL}/admin/update_user`, formData)
  //       .subscribe({
  //         next: () => {
  //           this.showAlert('نجاح', 'تم تحديث حالة المستخدم', 'success');
  //         },
  //         error: (error) => {
  //           this.showAlert('خطأ', 'فشل في تحديث حالة المستخدم', 'error');
  //         },
  //       });
  //   }
  // }

  // Pagination Logic
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginatedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }
  goToPage(page: number | string): void {
    if (page === 'prev') {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadPageData();
      }
    } else if (page === 'next') {
      if (this.currentPage < this.lastPage) {
        this.currentPage++;
        this.loadPageData();
      }
    } else if (typeof page == 'number') {
      this.currentPage = page;
      this.loadPageData();
    }
  }

  private loadPageData(): void {
    if (this.searchTerm) {
      this.filterUsers();
    } else {
      this.getUsers(this.currentPage);
    }
  }

  filterUsers(): void {
    const subscribe = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/filter_users`, {
        search: this.searchTerm,
        page: this.currentPage,
      })
      .subscribe({
        next: (data) => {
          this.filteredUsers = data.users.data;

          // تحديث خصائص الباجينيشين من السيرفر حتى بعد الفلترة
          this.currentPage = data.users.current_page;
          this.itemsPerPage = data.users.per_page;
          this.totalItems = data.users.total;
          this.lastPage = data.users.last_page;
          this.firstPageUrl = data.users.first_page_url;
          this.lastPageUrl = data.users.last_page_url;
          this.nextPageUrl = data.users.next_page_url;
          this.prevPageUrl = data.users.prev_page_url;
          this.links = data.users.links;
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في تصفية المستخدمين', 'error');
        },
      });
    this.Subscription.push(subscribe);
  }
  // exportToExcel(): void {
  //   const subscribe = this.callApi
  //     .postData(`${environment.API_BASE_URL}/admin/filte_users`, {
  //       search: this.searchTerm,
  //       export: true,
  //     })
  //     .subscribe({
  //       next: (data) => {
  //         try {
  //           const exportData = data.users.data.map((user: any) => ({
  //             ID: user.id,
  //             الاسم: user.name,
  //             الإيميل: user.email,
  //             الجنس: user.gender === 'male' ? 'ذكر' : 'أنثى',
  //             'تاريخ الميلاد': user.birthday,
  //             الدولة: user.country?.ar_name || '',
  //             المدينة: user.region?.ar_name || '',
  //             الصورة: user.photo
  //               ? `${environment.API_BASE_URL}/storage/${user.photo}`
  //               : 'لا يوجد صورة',
  //           }));

  //           const worksheet: XLSX.WorkSheet =
  //             XLSX.utils.json_to_sheet(exportData);
  //           const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  //           XLSX.utils.book_append_sheet(workbook, worksheet, 'المستخدمين');
  //           XLSX.writeFile(workbook, 'المستخدمين.xlsx');
  //           this.showAlert(
  //             'نجاح',
  //             'تم تصدير البيانات إلى إكسل بنجاح',
  //             'success'
  //           );
  //         } catch (error) {
  //           console.error('خطأ في التصدير إلى إكسل:', error);
  //           this.showAlert('خطأ', 'فشل في تصدير البيانات إلى إكسل', 'error');
  //         }
  //       },
  //       error: (error) => {
  //         this.auth.handleError(error);
  //         this.showAlert('خطأ', 'فشل في جلب البيانات للتصدير', 'error');
  //       },
  //     });
  //   this.Subscription.push(subscribe);
  // }

  exportToExcel(): void {
    this.getAllUsers()
      .then((allUsers) => {
        try {
          const exportData = allUsers.map((user: any) => ({
            ID: user.id,
            الاسم: user.name,
            الإيميل: user.email,
            الجنس:
              user.gender === 'male'
                ? 'ذكر'
                : user.gender === 'female'
                ? 'أنثى'
                : 'غير محدد',
            'تاريخ الميلاد': user.birthday,
            الدولة: user.country?.ar_name || '',
            المدينة: user.region?.ar_name || '',
            الصورة: user.photo
              ? `${environment.API_BASE_URL}/storage/${user.photo}`
              : 'لا يوجد صورة',
          }));

          const worksheet: XLSX.WorkSheet =
            XLSX.utils.json_to_sheet(exportData);
          const workbook: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'المستخدمين');
          XLSX.writeFile(workbook, 'المستخدمين.xlsx');
          this.showAlert('نجاح', 'تم تصدير البيانات إلى إكسل بنجاح', 'success');
        } catch (error) {
          console.error('خطأ في التصدير إلى إكسل:', error);
          this.showAlert('خطأ', 'فشل في تصدير البيانات إلى إكسل', 'error');
        }
      })
      .catch((error) => {
        this.auth.handleError(error);
        this.showAlert('خطأ', 'فشل في جلب البيانات للتصدير', 'error');
      });
  }

  private async getAllUsers(): Promise<any[]> {
    let allUsers: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const response = await this.callApi
        .postData(`${environment.API_BASE_URL}/admin/filter_users`, {
          search: this.searchTerm,
          export: true,
          page: currentPage,
          per_page: 1000, // Request more items per page if supported by your API
        })
        .toPromise();

      allUsers = [...allUsers, ...response.users.data];
      totalPages = response.users.last_page;
      currentPage++;
    } while (currentPage <= totalPages);

    return allUsers;
  }

  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  private showAlert(title: string, text: string, icon: 'success' | 'error') {
    Swal.fire({ title, text, icon, confirmButtonText: 'موافق' });
  }

  private showConfirm(title: string, text: string) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم',
      cancelButtonText: 'إلغاء',
    });
  }

  ngOnDestroy(): void {
    this.Subscription.forEach((sub) => sub.unsubscribe());
  }
}
