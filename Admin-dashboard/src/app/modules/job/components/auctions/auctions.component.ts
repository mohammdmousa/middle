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
  selector: 'app-auctions',
  standalone: false,
  templateUrl: './auctions.component.html',
  styleUrl: './auctions.component.css',
})
export class AuctionsComponent {
  auctions: any[] = [];
  url: any = environment.url;
  countries: any[] = [];
  cities: any[] = [];
  categories: any[] = [];
  mainCategories: any[] = [];
  customFields: any[] = [];
  totalItems: number = 0;
  lastPage: number = 1;
  links: any[] = [];
  perPage: number = 10;
  filteredCities: any[] = [];
  currentPage: number = 1;
  selectedAuction: any = {
    name: '',
    category_id: null,
    country_id: null,
    region_id: null,
    start_date: null,
    end_date: null,
    latitude: null,
    longitude: null,
    description: '',
    phone: '',
    email: '',
    whatsapp: '',
    images: [],
    fieldvalues: [],
    status: 'pending',
  };
  isLoading: boolean = false;
  Subscription: Subscription[] = [];
  filters = {
    country_id: null,
    region_id: null,
    category_id: null,
    start_date: null,
    end_date: null,
  };

  constructor(
    private callApi: CallapiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getAuctions();
    this.getCountries();
    this.getCategories();
  }
  getPlainDescription(): string {
    if (!this.selectedAuction.description) return '';

    let text = this.selectedAuction.description
      .replace(/<br\s*[/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // الحفاظ على المسافات البيضاء المتعددة في العرض
    return text.replace(/  /g, ' \u00A0'); // استبدال مسافتين بمسافة+غير منقسمة
  }
  setPlainDescription(value: string): void {
    this.selectedAuction.description = value;
  }
  getAuctions(page: number = 1): void {
    const params = {
      page: page,
      ...this.filters,
    };

    const subscribe = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/auctions`, params)
      .subscribe({
        next: (data) => {
          this.auctions = data.auction.data;
          this.currentPage = data.auction.current_page;
          this.perPage = data.auction.per_page;
          this.totalItems = data.auction.total;
          this.lastPage = data.auction.last_page;
          this.links = data.auction.links;
        },
        error: (error) => {
          this.auth.handleError(error);
        },
      });
  }
  toggleCheckboxOption(fieldId: number, option: string): void {
    let fieldValue = this.selectedAuction.fieldvalues.find(
      (fv: any) => fv.custom_field_id == fieldId
    );

    if (!fieldValue) {
      fieldValue = {
        custom_field_id: fieldId,
        value: [],
      };
      this.selectedAuction.fieldvalues.push(fieldValue);
    }

    if (!fieldValue.value) {
      fieldValue.value = [];
    }
  }
  applyFilters(): void {
    this.currentPage = 1;
    if (this.filters.start_date && this.filters.end_date) {
      const fromDate = new Date(this.filters.start_date);
      const toDate = new Date(this.filters.end_date);

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
      start_date: this.filters.start_date
        ? this.formatDate(this.filters.start_date)
        : null,
      end_date: this.filters.end_date
        ? this.formatDate(this.filters.end_date)
        : null,
    };

    const subscribe = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/filter_auction`, {
        ...filters,
        page: this.currentPage,
      })
      .subscribe({
        next: (data) => {
          this.auctions = data.auctions.data;
          this.currentPage = data.auctions.current_page;
          this.perPage = data.auctions.per_page;
          this.totalItems = data.auctions.total;
          this.lastPage = data.auctions.last_page;
          this.links = data.auctions.links;
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
      start_date: null,
      end_date: null,
    };
    this.filteredCities = [];
    this.getAuctions();
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
      this.getAuctions(this.currentPage);
    } else if (page === 'next' && this.currentPage < this.lastPage) {
      this.currentPage++;
      this.getAuctions(this.currentPage);
    } else if (typeof page === 'number') {
      this.currentPage = page;
      this.getAuctions(this.currentPage);
    }
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

  onCountryChange(countryId: number): void {
    if (countryId) {
      const selectedCountry = this.countries.find((c) => c.id == countryId);
      this.cities = selectedCountry?.regions || [];
    } else {
      this.cities = [];
      if (this.selectedAuction) {
        this.selectedAuction.region_id = null;
      }
    }
  }

  openEditModal(auction: any): void {
    this.getAuctionDetails(auction.id);
  }

  getAuctionDetails(auctionId: number): void {
    const subscribe = this.callApi
      .postData(
        `${environment.API_BASE_URL}/admin/view_auction/${auctionId}`,
        auctionId
      )
      .subscribe({
        next: (response) => {
          this.selectedAuction = {
            ...response.auction,
            fieldvalues: response.auction.fieldvalues || [],
            images: response.auction.images || [],
          };

          if (this.selectedAuction.category_id) {
            this.loadCustomFields(this.selectedAuction.category_id);
          }

          if (this.selectedAuction.country_id) {
            this.onCountryChange(this.selectedAuction.country_id);
          }

          const modalEl = document.getElementById('editAuctionModal');
          if (modalEl) {
            const modal = new Modal(modalEl);
            modal.show();
          }
        },
        error: (error) => {
          this.auth.handleError(error);
        },
      });
    this.Subscription.push(subscribe);
  }

  loadCustomFields(categoryId: number): void {
    const subscribe = this.callApi
      .getData(
        `${environment.API_BASE_URL}/admin/category_fields/${categoryId}`
      )
      .subscribe({
        next: (response) => {
          this.customFields = response.category.customfields || [];

          this.customFields.forEach((field) => {
            const existingField = this.selectedAuction.fieldvalues.find(
              (fv: any) => fv.custom_field_id === field.id
            );

            if (!existingField) {
              this.selectedAuction.fieldvalues.push({
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

  get fieldValues(): any {
    const values: any = {};

    this.selectedAuction.fieldvalues.forEach((field: any) => {
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
    const fieldValue = this.selectedAuction.fieldvalues.find(
      (fv: any) => fv.custom_field_id === fieldId
    );
    return fieldValue?.file_path || null;
  }

  setFieldValue(fieldId: number, value: any): void {
    let fieldValue = this.selectedAuction.fieldvalues.find(
      (fv: any) => fv.custom_field_id === fieldId
    );

    if (!fieldValue) {
      fieldValue = {
        custom_field_id: fieldId,
        value: value,
      };
      this.selectedAuction.fieldvalues.push(fieldValue);
    } else {
      fieldValue.value = value;
    }
  }
  ///////////////////
  onFileChange(event: any, fieldId: number): void {
    const file = event.target.files[0];
    if (file) {
      let fieldValue = this.selectedAuction.fieldvalues.find(
        (fv: any) => fv.custom_field_id === fieldId
      );

      if (!fieldValue) {
        fieldValue = {
          custom_field_id: fieldId,
          value: file,
          file_path: file.name,
        };
        this.selectedAuction.fieldvalues.push(fieldValue);
      } else {
        fieldValue.value = file;
        fieldValue.file_path = file.name;
      }
    }
  }

  onImageUpload(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.selectedAuction.images.push({
              file: file,
              preview: e.target.result,
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }
  openMapModal(): void {
    // إنشاء عناصر DOM للخريطة
    const mapDiv = document.createElement('div');
    mapDiv.id = 'editLocationMap';
    mapDiv.style.height = '400px';
    mapDiv.style.width = '100%';

    // عنصر لعرض العنوان
    const addressDiv = document.createElement('div');
    addressDiv.id = 'addressDisplay';
    addressDiv.className = 'mt-3 p-2 bg-light rounded';
    addressDiv.style.minHeight = '50px';

    const container = document.createElement('div');
    container.appendChild(mapDiv);
    container.appendChild(addressDiv);

    Swal.fire({
      title: 'تحديد الموقع على الخريطة',
      html: container,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'حفظ الموقع',
      cancelButtonText: 'إلغاء',
      didOpen: () => {
        this.initEditMap(mapDiv, addressDiv);
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // يمكنك هنا معالجة الموقع المحفوظ
      }
    });
  }

  private initEditMap(
    mapElement: HTMLElement,
    addressElement: HTMLElement
  ): void {
    // إصلاح مشكلة أيقونات العلامة
    this.fixMarkerIcons();

    // القيم الافتراضية (الرياض)
    let lat = 24.7136;
    let lng = 46.6753;

    // إذا كان هناك موقع محفوظ مسبقاً
    if (this.selectedAuction.latitude && this.selectedAuction.longitude) {
      lat = parseFloat(this.selectedAuction.latitude);
      lng = parseFloat(this.selectedAuction.longitude);
    }

    // تهيئة الخريطة
    const map = L.map(mapElement).setView([lat, lng], 15);

    // إضافة طبقة الخريطة
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // إضافة علامة قابلة للسحب
    const marker = L.marker([lat, lng], {
      draggable: true,
    }).addTo(map);

    // عرض العنوان الحالي إذا كان موجوداً
    if (this.selectedAuction.location) {
      addressElement.innerHTML = `<strong>الموقع الحالي:</strong> ${this.selectedAuction.location}`;
    }

    // عند النقر على الخريطة
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      this.updateLocationFromMap(e.latlng.lat, e.latlng.lng, addressElement);
    });

    // عند سحب العلامة
    marker.on('dragend', () => {
      const newPos = marker.getLatLng();
      this.updateLocationFromMap(newPos.lat, newPos.lng, addressElement);
    });

    // جلب العنوان الأولي إذا كان هناك إحداثيات
    if (this.selectedAuction.latitude && this.selectedAuction.longitude) {
      this.getAddressFromCoordinates(lat, lng, addressElement);
    }
  }

  private updateLocationFromMap(
    lat: number,
    lng: number,
    addressElement: HTMLElement
  ): void {
    // تحديث النموذج
    this.selectedAuction.latitude = lat.toString();
    this.selectedAuction.longitude = lng.toString();

    // جلب العنوان الجديد
    this.getAddressFromCoordinates(lat, lng, addressElement);
  }

  private async getAddressFromCoordinates(
    lat: number,
    lng: number,
    addressElement: HTMLElement
  ): Promise<void> {
    try {
      addressElement.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> جاري جلب العنوان...';

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();

      if (data.display_name) {
        this.selectedAuction.location = data.display_name;
        addressElement.innerHTML = `<strong>الموقع المحدد:</strong> ${data.display_name}`;
      } else {
        addressElement.innerHTML =
          '<strong>الموقع المحدد:</strong> لا يوجد عنوان مفصل';
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      addressElement.innerHTML =
        '<strong>الموقع المحدد:</strong> تعذر جلب العنوان';
    }
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
  removeImage(index: number, imageId: number): void {
    // حفظ الصورة المحذوفة مؤقتاً في حالة فشل العملية
    const deletedImage = this.selectedAuction.images[index];

    // 1. الحذف الفوري من الواجهة
    this.selectedAuction.images.splice(index, 1);

    // 2. إرسال طلب الحذف إلى الخادم
    const sub = this.callApi
      .deleteData(
        `${environment.API_BASE_URL}/admin/delete_image/${imageId}`,
        imageId
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.selectedAuction.images.splice(index, 0, deletedImage);
            this.showAlert('نجاح', 'تم حذف الصورة بنجاح', 'success');
          }
        },
        error: (error) => {
          // في حالة خطأ، نعيد الصورة للواجهة
          this.selectedAuction.images.splice(index, 0, deletedImage);
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في حذف الصورة', 'error');
        },
      });

    this.Subscription.push(sub);
  }
  getImageUrl(image: any): string {
    if (image.url) {
      return image.url;
    } else if (image.preview) {
      return image.preview;
    }
    return 'assets/images/default-auction.jpg';
  }

  updateAuction(): void {
    if (!this.selectedAuction) return;

    // التحقق من صحة التواريخ
    const startDate = new Date(this.selectedAuction.start_date);
    const endDate = new Date(this.selectedAuction.end_date);

    if (startDate >= endDate) {
      this.showAlert(
        'خطأ',
        'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
        'error'
      );
      return;
    }

    this.isLoading = true;

    // إعداد FormData لإرسال البيانات
    const formData = new FormData();

    // إضافة الحقول الأساسية
    formData.append('id', this.selectedAuction.id.toString());
    formData.append('name', this.selectedAuction.name);
    formData.append('category_id', this.selectedAuction.category_id.toString());
    formData.append('country_id', this.selectedAuction.country_id.toString());
    formData.append('region_id', this.selectedAuction.region_id.toString());
    formData.append('description', this.selectedAuction.description);
    formData.append('latitude', this.selectedAuction.latitude);
    formData.append('longitude', this.selectedAuction.longitude);
    formData.append('status', this.selectedAuction.status);
    formData.append(
      'start_date',
      this.formatDateTime(this.selectedAuction.start_date)
    );
    formData.append(
      'end_date',
      this.formatDateTime(this.selectedAuction.end_date)
    );
    formData.append('phone', this.selectedAuction.phone);
    formData.append('email', this.selectedAuction.email);
    formData.append('whatsapp', this.selectedAuction.whatsapp || '');

    // إضافة الصور الجديدة
    this.selectedAuction.images.forEach((image: any, index: number) => {
      if (image.file) {
        formData.append(`images[${index}]`, image.file);
      }
    });

    // إضافة الحقول المخصصة
    this.selectedAuction.fieldvalues.forEach((field: any) => {
      if (field.custom_field_id) {
        // لحقول الملفات
        if (field.value instanceof File) {
          formData.append(`fieldvalues[${field.custom_field_id}]`, field.value);
        }
        // لحقول الاختيار المتعدد
        else if (Array.isArray(field.value)) {
          field.value.forEach((val: string) => {
            formData.append(`fieldvalues[${field.custom_field_id}][]`, val);
          });
        }
        // لبقية أنواع الحقول
        else if (field.value !== null && field.value !== undefined) {
          formData.append(`fieldvalues[${field.custom_field_id}]`, field.value);
        }
      }
    });

    const sub = this.callApi
      .updateData(
        `${environment.API_BASE_URL}/admin/update_auction/${this.selectedAuction.id}`,
        formData
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response) {
            this.showAlert('نجاح', 'تم تحديث المزاد بنجاح', 'success');
            this.getAuctions();
            this.closeModal('editAuctionModal');
          } else {
            this.showAlert(
              'خطأ',
              response.message || 'فشل في تحديث المزاد',
              'error'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.log(error);
          this.auth.handleError(error);
          this.showAlert('خطأ', 'فشل في تحديث المزاد', 'error');
        },
      });
    this.Subscription.push(sub);
  }
  private formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  deleteAuction(id: number): void {
    this.showConfirm(
      'هل أنت متأكد؟',
      'سيتم حذف المزاد وجميع البيانات المرتبطة به'
    ).then((result) => {
      if (result.isConfirmed) {
        const subscribe = this.callApi
          .deleteData(
            `${environment.API_BASE_URL}/admin/delete_auction/${id}`,
            id
          )
          .subscribe({
            next: (response) => {
              this.getAuctions();
              this.showAlert('نجاح', 'تم حذف المزاد بنجاح', 'success');
            },
            error: (error) => {
              this.auth.handleError(error);
              this.showAlert('خطأ', 'فشل في حذف المزاد', 'error');
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

  exportToExcel(): void {
    this.getAllAuctions()
      .then((allAuctions) => {
        try {
          const exportData = allAuctions.map((auction: any) => ({
            ID: auction.id,
            'اسم المزاد': auction.name,
            الفئة:
              auction.category?.ar_name || auction.category?.en_name || 'N/A',
            'الفئة ألفرعية ': this.getAncestorsNames(
              auction.category?.ancestors || []
            ),
            البلد:
              auction.country?.ar_name || auction.country?.en_name || 'N/A',
            المدينة:
              auction.region?.ar_name || auction.region?.en_name || 'N/A',
            'تاريخ البدء': auction.start_date,
            'تاريخ الانتهاء': auction.end_date,
            'رقم الهاتف': auction.phone,
            'البريد الإلكتروني': auction.email,
            واتساب: auction.whatsapp,
            'تاريخ الإنشاء': auction.created_at,
            'تاريخ التحديث': auction.updated_at,
          }));

          const worksheet: XLSX.WorkSheet =
            XLSX.utils.json_to_sheet(exportData);
          const workbook: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'المزادات');

          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];

          XLSX.writeFile(workbook, `المزادات_${dateStr}.xlsx`);
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

  private async getAllAuctions(): Promise<any[]> {
    let allAuctions: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    const exportFilters = {
      ...this.filters,
      per_page: 100,
      export: true,
    };

    do {
      const response = await this.callApi
        .postData(`${environment.API_BASE_URL}/admin/filter_auction`, {
          ...exportFilters,
          page: currentPage,
        })
        .toPromise();

      allAuctions = [...allAuctions, ...response.auctions.data];
      totalPages = response.auctions.last_page;
      currentPage++;
    } while (currentPage <= totalPages);

    return allAuctions;
  }

  private showAlert(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning'
  ) {
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

  ngOnDestroy(): void {
    this.Subscription.forEach((sub) => sub.unsubscribe());
  }
}
