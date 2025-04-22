import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CallapiService } from '../../service/callapi.service';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { catchError, map, Observable, Subscription } from 'rxjs';
interface Field {
  id: number;
  category_id: number;
  ar_name: string;
  en_name: string;
  type: string;
  min_length?: number | null;
  max_length?: number | null;
  options?: string[] | null;
  is_required: boolean;
  custom_icon?: string | null;
  level?: number;
  multiple?: boolean;
  created_at?: string;
  updated_at?: string;
}
interface FieldValueResponse {
  status: boolean;
  custom_field_values: FieldValue[];
}

interface FieldValue {
  id?: number;
  owner_table_type: string;
  owner_table_id: number;
  custom_field_id: number;
  value: any;
  file_path: string | null;
  created_at: string;
  updated_at: string;
  field?: Field; // تم التعديل من field_info إلى field
}
interface Category {
  id: number;
  ar_name: string;
  en_name: string;
  children?: Category[];
  level: number;
}

interface Country {
  id: number;
  en_name: string;
  ar_name: string;
  regions?: Region[];
}

interface Region {
  id: number;
  country_id: number;
  en_name: string;
  ar_name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Company {
  id: number;
  en_name: string;
  ar_name: string;
}
@Component({
  selector: 'app-add-advertisements',
  standalone: false,
  templateUrl: './add-advertisements.component.html',
  styleUrl: './add-advertisements.component.css',
})
export class AddAdvertisementsComponent {
  adForm: FormGroup;
  private map: any;
  private marker: any;
  mapInitialized = false;

  countries: Country[] = [];
  cities: Region[] = [];
  users: User[] = [];
  companies: Company[] = [];
  publisherUsers: User[] = [];
  publisherCompanies: Company[] = [];
  subscriptions: Subscription[] = [];
  categoriesTree: Category[] = [];
  formFields: Field[] = [];
  isUserType: boolean = true;
  isPublisherUserType: boolean = true;
  isLoading: boolean = false;
  currentCheckboxValues: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private callApi: CallapiService,
    private auth: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.adForm = this.fb.group({
      country_id: ['', Validators.required],
      region_id: ['', Validators.required],
      latitude: [''],
      longitude: [''],
      use_current_location: [false],
      category_id: ['', Validators.required],
      publisher_type: ['user', Validators.required],
      publisher_id: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.getCountries();
    this.loadUsers();
    this.loadPublisherUsers();
    this.loadCategoriesTree();

    this.adForm.get('advertiser_type')?.valueChanges.subscribe((value) => {
      this.isUserType = value === 'user';
      this.adForm.get('advertiser_id')?.reset();
      if (this.isUserType) {
        this.loadUsers();
      } else {
        this.loadCompanies();
      }
    });

    this.adForm.get('publisher_type')?.valueChanges.subscribe((value) => {
      this.isPublisherUserType = value === 'user';
      this.adForm.get('publisher_id')?.reset();
      if (this.isPublisherUserType) {
        this.loadPublisherUsers();
      } else {
        this.loadPublisherCompanies();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    if (this.mapInitialized) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // القيم الافتراضية (الرياض)
    let lat = 24.7136;
    let lng = 46.6753;

    // إذا كان هناك موقع محفوظ مسبقاً
    const currentLat = this.adForm.get('latitude')?.value;
    const currentLng = this.adForm.get('longitude')?.value;
    if (currentLat && currentLng) {
      lat = parseFloat(currentLat);
      lng = parseFloat(currentLng);
    }

    // تهيئة الخريطة
    this.map = L.map(mapElement).setView([lat, lng], 12);

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
    this.adForm.patchValue({
      latitude: lat,
      longitude: lng,
    });
    this.marker.setLatLng([lat, lng]);
  }

  // تعديل دالة تحديد الموقع الحالي
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.updateLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          this.map.setView(
            [position.coords.latitude, position.coords.longitude],
            15
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          this.showAlert('Error', 'Failed to get current location', 'error');
          this.adForm.patchValue({
            use_current_location: false,
          });
        }
      );
    } else {
      this.showAlert(
        'Error',
        'Geolocation is not supported by this browser',
        'error'
      );
      this.adForm.patchValue({
        use_current_location: false,
      });
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadPublisherUsers(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/users`)
      .subscribe({
        next: (response: any) => {
          this.publisherUsers = response.users?.data || [];
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load publisher users', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  loadPublisherCompanies(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/companies`)
      .subscribe({
        next: (response: any) => {
          this.publisherCompanies = response.companies || [];
        },
        error: (error) => {
          this.showAlert(
            'Error',
            'Failed to load publisher companies',
            'error'
          );
        },
      });
    this.subscriptions.push(sub);
  }

  onCheckboxChange(fieldName: string, option: string, event: any): void {
    if (!this.currentCheckboxValues[fieldName]) {
      this.currentCheckboxValues[fieldName] = [];
    }

    if (event.target.checked) {
      this.currentCheckboxValues[fieldName].push(option);
    } else {
      this.currentCheckboxValues[fieldName] = this.currentCheckboxValues[
        fieldName
      ].filter((item) => item !== option);
    }

    this.adForm.get(fieldName)?.setValue(this.currentCheckboxValues[fieldName]);
  }
  loadCategoriesTree(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categoryTree`)
      .subscribe({
        next: (response: any) => {
          this.categoriesTree = response.allCategories || [];
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.showAlert('Error', 'Failed to load categories', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  onCategorySelect(): void {
    const categoryId = this.adForm.get('category_id')?.value;
    if (categoryId) {
      this.loadCategoryFields(categoryId);
    } else {
      this.removeDynamicFields();
      this.formFields = [];
    }
  }

  loadCategoryFields(categoryId: number): void {
    const sub = this.callApi
      .getData(
        `${environment.API_BASE_URL}/admin/category_fields/${categoryId}`
      )
      .subscribe({
        next: (response: any) => {
          this.removeDynamicFields();
          this.formFields = response.category?.customfields || [];
          this.addFieldsToForm();
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load fields', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // private addFieldsToForm(): void {
  //   this.formFields.forEach((field) => {
  //     const validators = [];
  //     if (field.is_required) {
  //       validators.push(Validators.required);
  //     }

  //     if (field.type === 'number') {
  //       validators.push(Validators.pattern(/^-?\d*\.?\d+$/));
  //     }

  //     if (field.min_length) {
  //       validators.push(Validators.minLength(field.min_length));
  //     }

  //     if (field.max_length) {
  //       validators.push(Validators.maxLength(field.max_length));
  //     }

  //     const control = new FormControl('', validators);
  //     this.adForm.addControl(field.en_name, control);
  //   });
  // }
  private addFieldsToForm(): void {
    this.formFields.forEach((field) => {
      const validators = [];
      if (field.is_required) {
        validators.push(Validators.required);
      }

      if (field.type === 'number') {
        validators.push(Validators.pattern(/^-?\d*\.?\d+$/));
      }

      if (field.min_length && field.type !== 'file') {
        validators.push(Validators.minLength(field.min_length));
      }

      if (field.max_length && field.type !== 'file') {
        validators.push(Validators.maxLength(field.max_length));
      }

      // تهيئة قيمة مختلفة لأنواع الحقول
      let initialValue: any = '';
      if (field.type === 'checkbox') {
        initialValue = [];
      } else if (field.type === 'file') {
        initialValue = null;
      }

      const control = new FormControl(initialValue, validators);
      this.adForm.addControl(field.en_name, control);
    });
  }
  private removeDynamicFields(): void {
    this.formFields.forEach((field) => {
      if (this.adForm.contains(field.en_name)) {
        this.adForm.removeControl(field.en_name);
      }
    });
  }

  flattenCategories(categories: Category[], level = 0): Category[] {
    let result: Category[] = [];
    categories.forEach((cat) => {
      const categoryWithLevel = { ...cat, level };
      result.push(categoryWithLevel);
      if (cat.children?.length) {
        result = result.concat(this.flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  }

  getCategoryPrefix(level: number): string {
    return '→ '.repeat(level);
  }

  getCountries(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/countries`)
      .subscribe({
        next: (response: any) => {
          this.countries = response.countries || [];
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load countries', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  onCountryChange(): void {
    const countryId = this.adForm.get('country_id')?.value;
    if (countryId) {
      const selectedCountry = this.countries.find((c) => c.id == countryId);
      this.cities = selectedCountry?.regions || [];
      this.adForm.get('region_id')?.reset();
    } else {
      this.cities = [];
      this.adForm.get('region_id')?.reset();
    }
  }

  loadUsers(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/users`)
      .subscribe({
        next: (response: any) => {
          this.users = response.users?.data || [];
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load users', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  loadCompanies(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/companies`)
      .subscribe({
        next: (response: any) => {
          this.companies = response.companies || [];
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load companies', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  onLocationCheckboxChange(): void {
    if (this.adForm.get('use_current_location')?.value) {
      this.getCurrentLocation();
    } else {
      this.adForm.patchValue({
        latitude: '',
        longitude: '',
      });
    }
  }

  // getCurrentLocation(): void {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         this.adForm.patchValue({
  //           latitude: position.coords.latitude,
  //           longitude: position.coords.longitude,
  //         });
  //       },
  //       (error) => {
  //         console.error('Error getting location:', error);
  //         this.showAlert('Error', 'Failed to get current location', 'error');
  //         this.adForm.patchValue({
  //           use_current_location: false,
  //         });
  //       }
  //     );
  //   } else {
  //     this.showAlert(
  //       'Error',
  //       'Geolocation is not supported by this browser',
  //       'error'
  //     );
  //     this.adForm.patchValue({
  //       use_current_location: false,
  //     });
  //   }
  // }

  onSubmit(): void {
    this.markFormGroupTouched(this.adForm);

    if (this.adForm.invalid) {
      this.showAlert(
        'Error',
        'Please fill all required fields correctly',
        'error'
      );
      return;
    }

    this.isLoading = true;
    const formData = this.prepareFormData();

    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_ad`, formData.formData)
      .subscribe({
        next: (response: any) => {
          if (response.ad?.id) {
            this.saveDynamicFields(response.ad.id, formData.dynamicFields);
          } else {
            this.isLoading = false;
            this.showAlert('Error', 'Unexpected response from server', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showAlert('Error', 'Failed to save advertisement', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  private prepareFormData(): { formData: FormData; dynamicFields: any } {
    const formData = new FormData();
    const dynamicFields: any = {};

    // إضافة البيانات الأساسية
    const baseFields = [
      'country_id',
      'region_id',
      'advertiser_type',
      'advertiser_id',
      'latitude',
      'longitude',
      'category_id',
      'publisher_id',
      'publisher_type',
    ];
    baseFields.forEach((field) => {
      const value = this.adForm.get(field)?.value;
      if (value !== null && value !== undefined) {
        formData.append(field, value.toString());
      }
    });

    // معالجة الحقول الديناميكية
    this.formFields.forEach((field) => {
      const control = this.adForm.get(field.en_name);
      const value = control?.value;

      if (field.type === 'file' && value) {
        if (Array.isArray(value)) {
          // إذا كانت هناك ملفات متعددة
          value.forEach((file: File, index: number) => {
            formData.append(`fields[${field.id}][${index}]`, file, file.name);
          });
          dynamicFields[field.id] = 'MULTIPLE_FILES_UPLOADED'; // فقط لحفظ حالة الحقل
        } else if (value instanceof File) {
          // إذا كان هناك ملف واحد
          formData.append(`fields[${field.id}]`, value, value.name);
          dynamicFields[field.id] = value; // فقط لحفظ حالة الحقل
        }
      } else {
        // إضافة الحقول الأخرى
        const valueToAppend =
          value !== null && value !== undefined ? value.toString() : '';
        formData.append(`fields[${field.id}]`, valueToAppend);
        dynamicFields[field.id] = value;
      }
    });

    return { formData, dynamicFields };
  }
  onFileChange(event: any, fieldName: string): void {
    const file = event.target.files[0]; // اختيار الملف الأول فقط
    if (file) {
      this.adForm.get(fieldName)?.setValue(file); // تحديث النموذج بالملف
    } else {
      this.adForm.get(fieldName)?.setValue(null); // إعادة القيمة إلى null إذا لم يتم اختيار ملف
    }
  }

  private saveDynamicFields(adId: number, fields: any): void {
    const fieldValuesData = new FormData(); // استخدام FormData بدلاً من كائن JSON
    fieldValuesData.append('owner_id', adId.toString());
    fieldValuesData.append('owner_type', 'ads');

    // إضافة الحقول الديناميكية إلى FormData
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (value instanceof File) {
        fieldValuesData.append(`fields[${key}]`, value, value.name); // إضافة الملف
        // } else if (Array.isArray(value)) {
        //   value.forEach((file: File, index: number) => {
        //     fieldValuesData.append(`fields[${key}][${index}]`, file, file.name); // إضافة الملفات المتعددة
        //   });
      } else {
        fieldValuesData.append(`fields[${key}]`, value.toString()); // إضافة القيم النصية
      }
    });

    this.callApi
      .postData(
        `${environment.API_BASE_URL}/admin/addupdate_fieldvalue`,
        fieldValuesData
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status && response.custom_field_values) {
            const fileFields = response.custom_field_values.filter(
              (f: any) => f.field?.type === 'file'
            );
            const failedUploads = fileFields.filter(
              (f: any) => f.file_path === null
            );
            if (failedUploads.length > 0) {
              this.showAlert(
                'Warning',
                'Advertisement saved but some files failed to upload',
                'warning'
              );
            } else {
              this.showAlert(
                'Success',
                'Advertisement saved successfully',
                'success'
              );
            }
          } else {
            this.showAlert(
              'Success',
              'Advertisement saved successfully',
              'success'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving field values:', error);
          let errorMessage = 'Failed to save field values';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            errorMessage = Object.values(error.error.errors).join('\n');
          }
          this.showAlert('Error', errorMessage, 'error');
        },
        complete: () => {
          this.router.navigate(['/dash/job/Opportunities'], {
            relativeTo: this.route,
          });
        },
      });
  }

  private resetForm(): void {
    this.adForm.reset({
      advertiser_type: 'user',
      use_current_location: false,
    });
    this.removeDynamicFields();
    this.formFields = [];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showAlert(title: string, text: string, icon: any): void {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK',
    });
  }
}
