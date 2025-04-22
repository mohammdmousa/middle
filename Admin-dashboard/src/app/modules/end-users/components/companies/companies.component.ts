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
  selector: 'app-companies',
  standalone: false,
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.css',
})
export class CompaniesComponent {
  constructor(private callApi: CallapiService, private auth: AuthService) {}

  Subscription: Subscription[] = [];
  url: string = environment.url;
  companies: any[] = [];
  filteredCompanies: any[] = [];
  countries: any[] = [];
  regions: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // For adding new company
  newCompany = {
    en_name: '',
    ar_name: '',
    email: '',
    password: '',
    phone: '',
    country_id: null as number | null,
    region_id: null as number | null,
    logo: null as File | null,
    commercial_file: null as File | null,
    state: 'active',
  };

  // For editing company
  editCompany = {
    id: null as number | null,
    en_name: '',
    ar_name: '',
    email: '',
    password: '',
    phone: '',
    country_id: null as number | null,
    region_id: null as number | null,
    logo: null as File | null,
    currentLogo: '',
    commercial_file: null as File | null,
    currentCommercialFile: '',
    state: 'active',
  };

  ngOnInit(): void {
    this.getCompanies();
    this.getCountries();
  }

  getCountries(): void {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/countries`)
      .subscribe({
        next: (data) => {
          this.countries = data.countries;

          // إذا كان هناك بلد محدد مسبقاً (في حالة التعديل)
          if (this.editCompany.country_id) {
            this.onCountryChange(this.editCompany.country_id, true);
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
        this.editCompany.region_id = null;
      } else {
        this.newCompany.region_id = null;
      }
      this.regions = [];
      return;
    }

    // البحث عن البلد المحدد
    const selectedCountry = this.countries.find((c) => c.id == countryId); // لاحظ استخدام == بدلاً من ===

    if (selectedCountry && 'regions' in selectedCountry) {
      this.regions = selectedCountry.regions || [];

      // إذا كان هناك منطقة واحدة فقط، حددها تلقائياً
      if (this.regions.length === 1) {
        if (isEdit) {
          this.editCompany.region_id = this.regions[0].id;
        } else {
          this.newCompany.region_id = this.regions[0].id;
        }
      }
    } else {
      this.regions = [];
      console.warn('No regions found for selected country');
    }
  }

  getCompanies() {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/companies`)
      .subscribe({
        next: (data) => {
          this.companies = data.companies;
          this.filteredCompanies = [...this.companies];
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to fetch companies', 'error');
        },
      });
    this.Subscription.push(subscribe);
  }

  openAddCompanyModal(): void {
    this.newCompany = {
      en_name: '',
      ar_name: '',
      email: '',
      password: '',
      phone: '',
      country_id: null,
      region_id: null,
      logo: null,
      commercial_file: null,
      state: 'active',
    };
    this.regions = [];
    const modalEl = document.getElementById('addCompanyModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  openEditCompanyModal(company: any): void {
    this.editCompany = {
      id: company.id,
      en_name: company.en_name,
      ar_name: company.ar_name,
      email: company.email,
      password: '',
      phone: company.phone,
      country_id: company.country_id,
      region_id: company.region_id,
      logo: company.logo,
      currentLogo: company.logo || '',
      commercial_file: company.trade_log,
      currentCommercialFile: company.commercial_file || '',
      state: company.state,
    };

    // Load regions for the selected country
    if (company.country_id) {
      this.onCountryChange(company.country_id, true);
    }

    const modalEl = document.getElementById('editCompanyModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  onLogoSelected(event: any): void {
    this.newCompany.logo = event.target.files[0];
  }

  onCommercialFileSelected(event: any): void {
    this.newCompany.commercial_file = event.target.files[0];
  }

  onEditLogoSelected(event: any): void {
    this.editCompany.logo = event.target.files[0];
  }

  onEditCommercialFileSelected(event: any): void {
    this.editCompany.commercial_file = event.target.files[0];
  }

  addCompany(form: NgForm): void {
    if (form.invalid) return;

    const formData = new FormData();
    formData.append('en_name', this.newCompany.en_name);
    formData.append('ar_name', this.newCompany.ar_name);
    formData.append('email', this.newCompany.email);
    formData.append('password', this.newCompany.password);
    formData.append('phone', this.newCompany.phone);
    formData.append('country_id', this.newCompany.country_id?.toString() || '');
    formData.append('region_id', this.newCompany.region_id?.toString() || '');
    formData.append('state', this.newCompany.state);

    if (this.newCompany.logo) {
      formData.append('logo', this.newCompany.logo, this.newCompany.logo.name);
    }

    if (this.newCompany.commercial_file) {
      formData.append(
        'trade_log',
        this.newCompany.commercial_file,
        this.newCompany.commercial_file.name
      );
    }

    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_company`, formData)
      .subscribe({
        next: () => {
          this.closeModal('addCompanyModal');
          this.getCompanies();
          this.showAlert('Success', 'Company added successfully', 'success');
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to add company', 'error');
        },
      });
  }

  saveEditCompany(form: NgForm): void {
    if (form.invalid || !this.editCompany.id) return;

    const formData = new FormData();
    formData.append('id', this.editCompany.id.toString());
    formData.append('en_name', this.editCompany.en_name);
    formData.append('ar_name', this.editCompany.ar_name);
    formData.append('email', this.editCompany.email);
    if (this.editCompany.password) {
      formData.append('password', this.editCompany.password);
    }
    formData.append('phone', this.editCompany.phone);
    formData.append(
      'country_id',
      this.editCompany.country_id?.toString() || ''
    );
    formData.append('region_id', this.editCompany.region_id?.toString() || '');
    formData.append('state', this.editCompany.state);

    if (this.editCompany.logo instanceof File) {
      formData.append(
        'logo',
        this.editCompany.logo,
        this.editCompany.logo.name
      );
    } else {
      formData.append('logo', '');
    }

    if (this.editCompany.commercial_file instanceof File) {
      formData.append(
        'trade_log',
        this.editCompany.commercial_file,
        this.editCompany.commercial_file.name
      );
    } else {
      formData.append('trade_log', '');
    }

    this.callApi
      .updateData(`${environment.API_BASE_URL}/admin/update_company`, formData)
      .subscribe({
        next: () => {
          this.closeModal('editCompanyModal');
          this.getCompanies();
          this.showAlert('Success', 'Company updated successfully', 'success');
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to update company', 'error');
        },
      });
  }

  deleteCompany(id: number): void {
    this.showConfirm(
      'Are you sure?',
      'This will delete the company permanently'
    ).then((result) => {
      if (result.isConfirmed) {
        this.callApi
          .deleteData(`${environment.API_BASE_URL}/admin/delete_company`, id)
          .subscribe({
            next: () => {
              this.companies = this.companies.filter(
                (company) => company.id !== id
              );
              this.filteredCompanies = [...this.companies];
              this.showAlert(
                'Success',
                'Company deleted successfully',
                'success'
              );
            },
            error: (error) => {
              this.showAlert('Error', 'Failed to delete company', 'error');
            },
          });
      }
    });
  }

  toggleCompanyState(id: number): void {
    const company = this.companies.find((c) => c.id === id);
    if (company) {
      company.state = company.state === 'active' ? 'inactive' : 'active';

      const formData = new FormData();
      formData.append('id', company.id.toString());
      formData.append('en_name', company.en_name);
      formData.append('ar_name', company.ar_name);
      formData.append('email', company.email);
      formData.append('phone', company.phone);
      formData.append('country_id', company.country_id?.toString() || '');
      formData.append('region_id', company.region_id?.toString() || '');
      formData.append('state', company.state);

      this.callApi
        .updateData(
          `${environment.API_BASE_URL}/admin/update_company`,
          formData
        )
        .subscribe({
          next: () => {
            this.showAlert('Success', 'Company status updated', 'success');
          },
          error: (error) => {
            this.showAlert('Error', 'Failed to update company status', 'error');
          },
        });
    }
  }

  // Pagination Logic
  get totalPages(): number {
    return Math.ceil(this.filteredCompanies.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginatedCompanies(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCompanies.slice(startIndex, endIndex);
  }

  filterCompanies(): void {
    if (!this.searchTerm) {
      this.filteredCompanies = [...this.companies];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCompanies = this.companies.filter(
      (company) =>
        company.en_name.toLowerCase().includes(term) ||
        company.ar_name.includes(term) ||
        company.email.toLowerCase().includes(term) ||
        company.phone.includes(term) ||
        company.id.toString().includes(term) ||
        (company.country &&
          company.country.en_name.toLowerCase().includes(term)) ||
        (company.region && company.region.en_name.toLowerCase().includes(term))
    );
  }

  exportToExcel(): void {
    const exportData = this.filteredCompanies.map((company) => ({
      ID: company.id,
      'Name (EN)': company.en_name,
      'Name (AR)': company.ar_name,
      Email: company.email,
      Phone: company.phone,
      Country: company.country?.en_name || '',
      Region: company.region?.en_name || '',
      Status: company.state,
      Logo: company.logo
        ? `${environment.API_BASE_URL}/storage/${company.logo}`
        : 'No Logo',
      'Commercial File': company.trade_log
        ? `${environment.API_BASE_URL}/storage/${company.trade_log}`
        : 'No File',
    }));

    try {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
      XLSX.writeFile(workbook, 'Companies.xlsx');
      this.showAlert(
        'Success',
        'Data exported to Excel successfully',
        'success'
      );
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showAlert('Error', 'Failed to export data to Excel', 'error');
    }
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
    Swal.fire({ title, text, icon, confirmButtonText: 'OK' });
  }

  private showConfirm(title: string, text: string) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    });
  }

  ngOnDestroy(): void {
    this.Subscription.forEach((sub) => sub.unsubscribe());
  }
}
