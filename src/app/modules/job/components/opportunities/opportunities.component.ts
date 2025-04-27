import { Component } from '@angular/core';
import { CallapiService } from '../../service/callapi.service';
import { AuthService } from '../../../../core/service/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Modal } from 'bootstrap';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-opportunities',
  standalone: false,
  templateUrl: './opportunities.component.html',
  styleUrl: './opportunities.component.css',
})
export class OpportunitiesComponent {
  ads: any[] = [];
  private map: any;
  private marker: any;
  mapInitialized = false;
  publishers: any[] = [];
  countries: any[] = [];
  cities: any[] = [];
  categories: any[] = [];
  mainCategories: any[] = [];
  customFields: any[] = []; // Added for custom fields
  totalItems: number = 0;
  lastPage: number = 1;
  links: any[] = [];
  perPage: number = 10;
  filteredAds: any[] = [];
  filteredCities: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  selectedAd: any = {
    category_id: null,
    publisher_type: null,
    country_id: null,
    region_id: null,
    latitude: null,
    longitude: null,
    state: 'active',
    fieldvalues: [], // Added for custom fields
  };
  isLoading: boolean = false;

  Subscription: Subscription[] = [];

  filters = {
    country_id: null,
    region_id: null,
    category_id: null,
    from_date: null,
    to_date: null,
  };

  constructor(
    private callApi: CallapiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getAds();
    this.getCountries();
    this.getCategories();
  }

  getAds(page: number = 1): void {
    const params = {
      page: page,
      ...this.filters,
    };

    const subscribe = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/filter_ads`, params)
      .subscribe({
        next: (data) => {
          this.ads = data.ads.data;
          this.currentPage = data.ads.current_page;
          this.perPage = data.ads.per_page;
          this.totalItems = data.ads.total;
          this.lastPage = data.ads.last_page;
          this.links = data.ads.links;
        },
        error: (error) => {
          this.auth.handleError(error);
        },
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    if (this.filters.from_date && this.filters.to_date) {
      const fromDate = new Date(this.filters.from_date);
      const toDate = new Date(this.filters.to_date);

      if (fromDate > toDate) {
        this.showAlert(
          'خطأ',
          'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
          'error'
        );
        return;
      }
    }

    const filters = {
      ...this.filters,
      start_date: this.filters.from_date
        ? this.formatDate(this.filters.from_date)
        : null,
      end_date: this.filters.to_date
        ? this.formatDate(this.filters.to_date)
        : null,
    };

    const subscribe = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/filter_ads`, filters)
      .subscribe({
        next: (data) => {
          this.ads = data.ads.data;
        },
        error: (error) => {
          this.auth.handleError(error);
        },
      });
    this.Subscription.push(subscribe);
  }

  private formatDate(date: any): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  resetFilters(): void {
    this.filters = {
      country_id: null,
      region_id: null,
      category_id: null,
      from_date: null,
      to_date: null,
    };
    this.filteredCities = [];
    this.getAds();
  }

  onCountryFilterChange(): void {
    this.filters.region_id = null;
    if (this.filters.country_id) {
      const country = this.countries.find(
        (c) => c.id == this.filters.country_id
      );
      this.filteredCities = country?.regions || [];
    } else {
      this.filteredCities = [];
    }
  }

  goToPage(page: number | string): void {
    if (page === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (page === 'next' && this.currentPage < this.lastPage) {
      this.currentPage++;
    } else if (typeof page === 'number') {
      this.currentPage = page;
    }
    this.getAds(this.currentPage);
  }

  isNumericLink(link: any): boolean {
    return !isNaN(Number(link.label));
  }

  getAncestorsNames(ancestors: any[]): string {
    if (!ancestors || ancestors.length === 0) return '';

    return ancestors
      .map((ancestor) => ancestor.ar_name || ancestor.en_name || '')
      .filter((name) => name.trim() !== '')
      .join(' ← ');
  }

  private loadPageData(): void {
    this.getAds(this.currentPage);
  }

  getCountries() {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/countries`)
      .subscribe({
        next: (response: any) => {
          this.countries = response.countries;
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في جلب بيانات البلدان', 'error');
        },
      });
    this.Subscription.push(subscribe);
  }

  getCategories() {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categoryTree`)
      .subscribe({
        next: (response: any) => {
          this.categories = response.allCategories;
          this.mainCategories = this.categories.filter((cat) => !cat.parent_id);

          this.categories.forEach((category) => {
            if (category.parent_id) {
              const parent = this.categories.find(
                (c) => c.id === category.parent_id
              );
              if (parent) {
                category.ancestors = [...(parent.ancestors || []), parent];
              }
            }
          });
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في جلب بيانات الفئات', 'error');
        },
      });
    this.Subscription.push(subscribe);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAds.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = startPage + maxPages - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginatedAds(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAds.slice(startIndex, endIndex);
  }

  onCountryChange(countryId: number): void {
    if (countryId) {
      const selectedCountry = this.countries.find((c) => c.id == countryId);
      this.cities = selectedCountry?.regions || [];
    } else {
      this.cities = [];
      if (this.selectedAd) {
        this.selectedAd.region_id = null;
      }
    }
  }

  openEditModal(ad: any): void {
    this.getAdDetails(ad.id);
  }
  getAdDetails(adId: number): void {
    const subscribe = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/view_ad`, { id: adId })
      .subscribe({
        next: (response) => {
          this.selectedAd = {
            ...response.ad,
            fieldvalues: response.ad.fieldvalues || [],
          };

          if (this.selectedAd.category_id) {
            this.loadCustomFields(this.selectedAd.category_id);
          }

          if (this.selectedAd.country_id) {
            this.onCountryChange(this.selectedAd.country_id);
          }

          const modalEl = document.getElementById('editAdModal');
          if (modalEl) {
            const modal = new Modal(modalEl);
            modal.show();

            // تهيئة الخريطة بعد فتح المودال
            setTimeout(() => {
              this.initMap();
            }, 100);
          }
        },
        error: (error) => {
          this.auth.handleError(error);
        },
      });
    this.Subscription.push(subscribe);
  }
  private initMap(): void {
    if (this.mapInitialized) return;

    const mapElement = document.getElementById('editLocationMap');
    if (!mapElement) return;

    // القيم الافتراضية (الرياض)
    let lat = 24.7136;
    let lng = 46.6753;

    // إذا كان هناك موقع محفوظ مسبقاً
    if (this.selectedAd.latitude && this.selectedAd.longitude) {
      lat = parseFloat(this.selectedAd.latitude);
      lng = parseFloat(this.selectedAd.longitude);
    }

    // تهيئة الخريطة
    this.map = L.map(mapElement).setView([lat, lng], 15);

    // إضافة طبقة الخريطة
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // إضافة علامة قابلة للسحب
    this.marker = L.marker([lat, lng], {
      draggable: true,
    }).addTo(this.map);

    // عند النقر على الخريطة
    this.map.on('click', (e: any) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng);
    });

    // عند سحب العلامة
    this.marker.on('dragend', () => {
      const newPos = this.marker.getLatLng();
      this.updateLocation(newPos.lat, newPos.lng);
    });

    this.mapInitialized = true;
  }

  private updateLocation(lat: number, lng: number): void {
    this.selectedAd.latitude = lat;
    this.selectedAd.longitude = lng;
    this.marker.setLatLng([lat, lng]);
  }

  private fixMarkerIcons(): void {
    const iconDefault = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  loadCustomFields(categoryId: number): void {
    const subscribe = this.callApi
      .getData(
        `${environment.API_BASE_URL}/admin/category_fields/${categoryId}`
      )
      .subscribe({
        next: (response) => {
          this.customFields = response.category.customfields || [];
          // تعيين القيم الافتراضية للحقول إذا لم تكن موجودة
          this.customFields.forEach((field) => {
            const existingField = this.selectedAd.fieldvalues.find(
              (fv: any) => fv.custom_field_id === field.id
            );

            if (!existingField) {
              this.selectedAd.fieldvalues.push({
                custom_field_id: field.id,
                value: field.type === 'checkbox' ? [] : null,
                file_path: null,
              });
            }
          });
        },
        error: (error) => {
          console.error('Error loading custom fields:', error);
          this.customFields = [];
        },
      });
    this.Subscription.push(subscribe);
  }
  // get fieldValues(): any {
  //   return this.selectedAd.fieldvalues.reduce((acc: any, field: any) => {
  //     acc[field.custom_field_id] = field.value;
  //     return acc;
  //   }, {});
  // }
  get fieldValues(): any {
    const values: any = {};

    this.selectedAd.fieldvalues.forEach((field: any) => {
      // تحويل القيم النصية للأرقام إذا كان الحقل رقمي
      if (
        this.customFields.find((f) => f.id === field.custom_field_id)?.type ==
        'number'
      ) {
        values[field.custom_field_id] = field.value
          ? Number(field.value)
          : null;
      } else {
        values[field.custom_field_id] = field.value;
      }
    });

    return values;
  }

  getFileFieldValue(fieldId: number): string | null {
    const fieldValue = this.selectedAd.fieldvalues.find(
      (fv: any) => fv.custom_field_id === fieldId
    );
    return fieldValue?.file_path || null;
  }

  setFieldValue(fieldId: number, value: any): void {
    let fieldValue = this.selectedAd.fieldvalues.find(
      (fv: any) => fv.custom_field_id === fieldId
    );

    if (!fieldValue) {
      fieldValue = {
        custom_field_id: fieldId,
        value: value,
      };
      this.selectedAd.fieldvalues.push(fieldValue);
    } else {
      fieldValue.value = value;
    }
  }

  isOptionSelected(fieldId: number, option: string): boolean {
    const fieldValue = this.selectedAd.fieldvalues.find(
      (fv: any) => fv.custom_field_id === fieldId
    );
    return fieldValue && fieldValue.value && fieldValue.value.includes(option);
  }

  toggleCheckboxOption(fieldId: number, option: string): void {
    let fieldValue = this.selectedAd.fieldvalues.find(
      (fv: any) => fv.custom_field_id === fieldId
    );

    if (!fieldValue) {
      fieldValue = {
        custom_field_id: fieldId,
        value: [],
      };
      this.selectedAd.fieldvalues.push(fieldValue);
    }

    if (!fieldValue.value) {
      fieldValue.value = [];
    }

    const index = fieldValue.value.indexOf(option);
    if (index === -1) {
      fieldValue.value.push(option);
    } else {
      fieldValue.value.splice(index, 1);
    }
  }

  onFileChange(event: any, fieldId: number): void {
    const file = event.target.files[0];
    if (file) {
      let fieldValue = this.selectedAd.fieldvalues.find(
        (fv: any) => fv.custom_field_id === fieldId
      );

      if (!fieldValue) {
        fieldValue = {
          custom_field_id: fieldId,
          value: file, // حفظ كائن الملف هنا
          file_path: file.name,
        };
        this.selectedAd.fieldvalues.push(fieldValue);
      } else {
        fieldValue.value = file; // تحديث بقيمة الملف الجديد
        fieldValue.file_path = file.name;
      }
    }
  }

  // updateAd(): void {
  //   if (!this.selectedAd) return;

  //   const adData = {
  //     id: this.selectedAd.id,
  //     category_id: this.selectedAd.category_id,
  //     country_id: this.selectedAd.country_id,
  //     region_id: this.selectedAd.region_id,
  //     latitude: this.selectedAd.latitude,
  //     longitude: this.selectedAd.longitude,
  //     fieldvalues: this.selectedAd.fieldvalues,
  //   };

  //   const subscribe = this.callApi
  //     .updateData(`${environment.API_BASE_URL}/admin/update_ad`, adData)
  //     .subscribe({
  //       next: (response) => {
  //         this.getAds();
  //         this.closeModal('editAdModal');
  //         this.showAlert('نجاح', 'تم تحديث الإعلان بنجاح', 'success');
  //       },
  //       error: (error) => {
  //         this.auth.handleError(error);
  //         this.showAlert('خطأ', 'فشل في تحديث الإعلان', 'error');
  //       },
  //     });
  //   this.Subscription.push(subscribe);
  // }
  updateAd(): void {
    if (!this.selectedAd) return;

    this.isLoading = true;
    const formData = this.prepareUpdateFormData();

    // إرسال البيانات الأساسية
    const sub = this.callApi
      .updateData(
        `${environment.API_BASE_URL}/admin/update_ad`,
        formData.formData
      )
      .subscribe({
        next: (response: any) => {
          if (response.ad?.id) {
            this.updateDynamicFields(response.ad.id, formData.dynamicFields);
          } else {
            this.isLoading = false;
            this.showAlert('Error', 'Unexpected response from server', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showAlert('Error', 'Failed to update advertisement', 'error');
        },
      });
    this.Subscription.push(sub);
  }

  private prepareUpdateFormData(): { formData: FormData; dynamicFields: any } {
    const formData = new FormData();
    const dynamicFields: any = {};

    // إضافة البيانات الأساسية
    const baseFields = [
      'id',
      'category_id',
      'country_id',
      'region_id',
      'latitude',
      'longitude',
      'publisher_id',
      'publisher_type',
    ];

    baseFields.forEach((field) => {
      const value = this.selectedAd[field];
      if (value !== null && value !== undefined) {
        formData.append(field, value.toString());
      }
    });

    // معالجة الحقول الديناميكية
    this.customFields.forEach((field) => {
      const fieldValue = this.selectedAd.fieldvalues.find(
        (fv: any) => fv.custom_field_id === field.id
      );
      const value = fieldValue?.value;

      if (field.type === 'file') {
        if (value instanceof File) {
          // ملف جديد تم رفعه
          formData.append(`fields[${field.id}]`, value, value.name);
          dynamicFields[field.id] = value;
        } else if (fieldValue?.file_path) {
          // ملف موجود لم يتم تغييره
          formData.append(`fields[${field.id}]`, fieldValue.file_path);
          dynamicFields[field.id] = fieldValue.file_path;
        }
      } else {
        const valueToAppend =
          value !== null && value !== undefined ? value.toString() : '';
        formData.append(`fields[${field.id}]`, valueToAppend);
        dynamicFields[field.id] = value;
      }
    });

    return { formData, dynamicFields };
  }

  private updateDynamicFields(adId: number, fields: any): void {
    const fieldValuesData = new FormData();
    fieldValuesData.append('owner_id', adId.toString());
    fieldValuesData.append('owner_type', 'ads');

    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (value instanceof File) {
        fieldValuesData.append(`fields[${key}]`, value, value.name);
      } else {
        fieldValuesData.append(`fields[${key}]`, value?.toString() ?? '');
      }
    });

    const sub = this.callApi
      .postData(
        `${environment.API_BASE_URL}/admin/addupdate_fieldvalue`,
        fieldValuesData
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.getAds();
          this.closeModal('editAdModal');
          this.showAlert(
            'Success',
            'Advertisement updated successfully',
            'success'
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.showAlert(
            'Warning',
            'Advertisement updated but some fields failed',
            'error'
          );
          console.error('Error updating dynamic fields:', error);
        },
      });
    this.Subscription.push(sub);
  }
  deleteAd(id: number): void {
    this.showConfirm(
      'هل أنت متأكد؟',
      'سيتم حذف الإعلان وجميع البيانات المرتبطة به'
    ).then((result) => {
      if (result.isConfirmed) {
        const subscribe = this.callApi
          .deleteData(`${environment.API_BASE_URL}/admin/delete_ad`, id)
          .subscribe({
            next: (response) => {
              this.getAds();
              this.showAlert('نجاح', 'تم حذف الإعلان بنجاح', 'success');
            },
            error: (error) => {
              this.auth.handleError(error);
              this.showAlert('خطأ', 'فشل في حذف الإعلان', 'error');
            },
          });
        this.Subscription.push(subscribe);
      }
    });
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
    Swal.fire({ title, text, icon, confirmButtonText: 'حسناً' });
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

  exportToExcel(): void {
    this.getAllAds()
      .then((allAds) => {
        try {
          const exportData = allAds.map((ad: any) => ({
            ID: ad.id,
            الناشر: ad.publisher?.ar_name || ad.publisher?.name || 'N/A',
            الفئة: ad.category?.ar_name || ad.category?.en_name || 'N/A',
            'الفئة الأم': this.getAncestorsNames(ad.category?.ancestors || []),
            البلد: ad.country?.ar_name || ad.country?.en_name || 'N/A',
            المدينة: ad.region?.ar_name || ad.region?.en_name || 'N/A',
            المشاهدات: ad.views || 0,
            المشاركات: ad.shares || 0,
            الحالة: this.getStateName(ad.state),
            'تاريخ الإنشاء': ad.created_at,
            'تاريخ التحديث': ad.updated_at,
          }));

          const worksheet: XLSX.WorkSheet =
            XLSX.utils.json_to_sheet(exportData);
          const workbook: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'الإعلانات');

          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];

          XLSX.writeFile(workbook, `الإعلانات_${dateStr}.xlsx`);
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

  private async getAllAds(): Promise<any[]> {
    let allAds: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    const exportFilters = {
      ...this.filters,
      per_page: 100,
      export: true,
    };

    do {
      const response = await this.callApi
        .postData(`${environment.API_BASE_URL}/admin/filter_ads`, {
          ...exportFilters,
          page: currentPage,
        })
        .toPromise();

      allAds = [...allAds, ...response.ads.data];
      totalPages = response.ads.last_page;
      currentPage++;
    } while (currentPage <= totalPages);

    return allAds;
  }

  private getStateName(state: string): string {
    switch (state) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return state;
    }
  }

  ngOnDestroy(): void {
    this.Subscription.forEach((sub) => sub.unsubscribe());
  }
}
