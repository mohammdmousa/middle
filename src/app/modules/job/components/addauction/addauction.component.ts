import { Component } from '@angular/core';
import { CallapiService } from '../../service/callapi.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../../../core/service/auth.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

interface User {
  id: number;
  name: string;
  email: string;
  company?: string;
}

interface Company {
  id: number;
  en_name: string;
  ar_name: string;
}

interface Category {
  id: number;
  ar_name: string;
  en_name: string;
  children?: Category[];
  level: number;
}

interface Country {
  id: string;
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

@Component({
  selector: 'app-addauction',
  standalone: false,
  templateUrl: './addauction.component.html',
  styleUrl: './addauction.component.css',
})
export class AddauctionComponent {
  isSubmitting = false;
  tinyMceApiKey = 'v3cjbkwgnj82x4uhtj5zx25pi1orenjdxgzaj22uw4zf0mtc';

  // Data lists
  users: User[] = [];
  companies: Company[] = [];
  countries: Country[] = [];
  cities: Region[] = [];
  mainCategories: Category[] = [];
  categoriesTree: Category[] = [];

  // Image handling
  previewImages: { file: File; url: string }[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];
  publisherUsers: User[] = [];
  publisherCompanies: Company[] = [];
  auction = {
    publisher_id: '',
    publisher_type: '',
    name: '',
    category_id: '',
    latitude: '',
    longitude: '',
    description: '',
    images: [] as File[],
    country: '',
    city: '',
    location: '',
    start_date: this.formatDateTime(new Date()),
    end_date: this.formatDateTime(
      new Date(new Date().setDate(new Date().getDate() + 1))
    ),
    phone: '',
    email: '',
    whatsapp: '',
  };

  constructor(
    private callApi: CallapiService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.getCountries();
    this.loadUsers();
    this.loadCategoriesTree();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onPublisherTypeChange(): void {
    this.auction.publisher_id = ''; // إعادة تعيين الحقل عند تغيير النوع
    if (this.auction.publisher_type === 'user') {
      this.loadPublisherUsers();
    } else if (this.auction.publisher_type === 'company') {
      this.loadPublisherCompanies();
    }
  }

  // تحميل قائمة المستخدمين
  loadPublisherUsers(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/users`)
      .subscribe({
        next: (response: any) => {
          this.publisherUsers = response.users?.data || [];
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load users', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // تحميل قائمة الشركات
  loadPublisherCompanies(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/companies`)
      .subscribe({
        next: (response: any) => {
          this.publisherCompanies = response.companies || [];
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to load companies', 'error');
        },
      });
    this.subscriptions.push(sub);
  }
  loadCategoriesTree(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categoryTree`)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.categoriesTree = response.allCategories || [];
          this.mainCategories = this.categoriesTree.filter(
            (cat) => cat.level === 1
          );
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.showAlert('Error', 'Failed to load categories', 'error');
        },
      });
    this.subscriptions.push(sub);
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
    const countryId = this.auction.country;
    if (countryId) {
      const selectedCountry = this.countries.find((c) => c.id == countryId);
      this.cities = selectedCountry?.regions || [];
      this.auction.city = '';
    } else {
      this.cities = [];
      this.auction.city = '';
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

  private formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  onImagesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.previewImages = [];
      this.auction.images = [];

      const filesToProcess = Array.from(files).slice(0, 10) as File[];

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewImages.push({
            file: file,
            url: e.target.result,
          });
        };
        reader.readAsDataURL(file);
        this.auction.images.push(file);
      });
    }
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
    this.auction.images.splice(index, 1);
  }

  openMapModal(): void {
    // إنشاء عناصر DOM
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.height = '400px';
    mapDiv.style.width = '100%';

    const container = document.createElement('div');
    container.appendChild(mapDiv);

    Swal.fire({
      title: 'تحديد الموقع على الخريطة',
      html: container,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'حفظ الموقع',
      cancelButtonText: 'إلغاء',
      didOpen: () => {
        this.initOSMMap(mapDiv);
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // يمكنك هنا معالجة الموقع المحفوظ
      }
    });
  }

  private initOSMMap(mapElement: HTMLElement): void {
    // تهيئة الخريطة
    const map = L.map(mapElement).setView([24.7136, 46.6753], 12); // مركز الخريطة (الرياض)

    // إضافة طبقة الخريطة الأساسية
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // إضافة علامة قابلة للسحب
    const marker = L.marker([24.7136, 46.6753], {
      draggable: true,
    }).addTo(map);

    // النقر على الخريطة لنقل العلامة
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      this.updateLocationFields(e.latlng.lat, e.latlng.lng);
    });

    // سحب العلامة
    marker.on('dragend', (e: L.LeafletEvent) => {
      const newPos = marker.getLatLng();
      this.updateLocationFields(newPos.lat, newPos.lng);
    });
  }

  private updateLocationFields(lat: number, lng: number): void {
    this.auction.latitude = lat.toString();
    this.auction.longitude = lng.toString();

    // استخدام خدمة Nominatim للحصول على العنوان (اختياري)
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.display_name) {
          this.auction.location = data.display_name;
        }
      });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    if (new Date(this.auction.end_date) <= new Date(this.auction.start_date)) {
      Swal.fire('Error', 'End date must be after start date', 'error');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('name', this.auction.name);
    formData.append('category_id', this.auction.category_id);

    formData.append('description', this.auction.description);
    formData.append('country_id', this.auction.country);
    formData.append('region_id', this.auction.city);
    formData.append('latitude', this.auction.latitude);
    formData.append('longitude', this.auction.longitude);

    formData.append('start_date', this.auction.start_date);
    formData.append('end_date', this.auction.end_date);
    formData.append('publisher_type', this.auction.publisher_type);
    formData.append('publisher_id', this.auction.publisher_id);
    formData.append('phone', this.auction.phone);
    formData.append('email', this.auction.email || '');
    formData.append('whatsapp', this.auction.whatsapp || '');

    this.auction.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_auction`, formData)
      .subscribe({
        next: (response) => {
          console.log(response);
          Swal.fire({
            title: 'Success',
            text: 'Auction added successfully',
            icon: 'success',
          }).then(() => {
            this.router.navigate(['/dash/job/auctions']);
          });
        },
        error: (error) => {
          console.error('Error adding auction:', error);
          Swal.fire({
            title: 'Error',
            text: error.error.message || 'Failed to add auction',
            icon: 'error',
          });
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    this.subscriptions.push(sub);
  }

  onReset(): void {
    this.auction = {
      publisher_id: '',
      publisher_type: '',
      name: '',
      latitude: '',
      longitude: '',
      category_id: '',
      description: '',
      images: [],
      country: '',
      city: '',
      location: '',
      start_date: this.formatDateTime(new Date()),
      end_date: this.formatDateTime(
        new Date(new Date().setDate(new Date().getDate() + 1))
      ),
      phone: '',
      email: '',
      whatsapp: '',
    };
    this.previewImages = [];
  }

  private showAlert(title: string, text: string, icon: any): void {
    Swal.fire({
      title,
      text,
      icon,
    });
  }
}
