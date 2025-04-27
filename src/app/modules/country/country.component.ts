import { Component, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { CallapiService } from './service/callapi.service';
import { AuthService } from '../../core/service/auth.service';
import { Modal } from 'bootstrap';
import { formatDate } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-country',
  standalone: false,
  templateUrl: './country.component.html',
  styleUrl: './country.component.css',
})
export class CountryComponent implements OnInit, OnDestroy {
  countries: any[] = [];
  filteredCountries: any[] = [];
  searchTerm: string = '';
  expandedRows: { [key: number]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;
  url: string = environment.url;
  // Add Country
  newCountry = {
    en_name: '',
    ar_name: '',
    flag: null as File | null,
    state: 'active',
  };

  // Edit Country
  editingCountry = {
    id: null as number | null,
    en_name: '',
    ar_name: '',
    flag: null as File | null,
    currentFlag: '',
    state: 'active',
  };

  // Add Region
  newRegion = {
    en_name: '',
    ar_name: '',
    country_id: null as number | null,
  };

  // Edit Region
  editingRegion = {
    id: null as number | null,
    en_name: '',
    ar_name: '',
    country_id: null as number | null,
  };

  private subscriptions: Subscription[] = [];

  constructor(private callApi: CallapiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.getCountry();
  }

  // Fetch Countries from API
  getCountry(): void {
    const sub = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/countries`)
      .subscribe({
        next: (data) => {
          this.countries = data.countries;
          this.filteredCountries = [...this.countries];
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to load countries', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // Toggle Row Expansion
  toggleRow(id: number): void {
    this.expandedRows[id] = !this.expandedRows[id];
  }

  isExpanded(id: number): boolean {
    return this.expandedRows[id];
  }

  // Toggle Country State
  toggleCountryState(id: number): void {
    const country = this.countries.find((c) => c.id === id);
    if (country) {
      country.state = country.state === 'active' ? 'inactive' : 'active';
      this.updateCountryState(country);
    }
  }

  private updateCountryState(country: any): void {
    const formData = new FormData();
    formData.append('id', country.id.toString());
    formData.append('state', country.state);

    const sub = this.callApi
      .updateData(`${environment.API_BASE_URL}/admin/update_country`, formData)
      .subscribe({
        next: () => {
          this.showAlert('Success', 'Country status updated', 'success');
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to update country status', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // Delete Country
  deleteCountry(id: number): void {
    this.showConfirm(
      'Are you sure?',
      'This will delete the country and all its regions'
    ).then((result) => {
      if (result.isConfirmed) {
        const sub = this.callApi
          .deleteData(`${environment.API_BASE_URL}/admin/delete_country`, id)
          .subscribe({
            next: () => {
              this.countries = this.countries.filter(
                (country) => country.id !== id
              );
              this.filteredCountries = [...this.countries];
              this.showAlert(
                'Deleted',
                'Country deleted successfully',
                'success'
              );
            },
            error: (error) => {
              this.auth.handleError(error);
              this.showAlert('Error', 'Failed to delete country', 'error');
            },
          });
        this.subscriptions.push(sub);
      }
    });
  }

  // Add Country
  openAddCountryModal(): void {
    this.newCountry = {
      en_name: '',
      ar_name: '',
      flag: null,
      state: 'active',
    };
    this.showModal('addCountryModal');
  }

  addCountry(form: NgForm): void {
    if (form.invalid || !this.newCountry.flag) return;

    const formData = new FormData();
    formData.append('en_name', this.newCountry.en_name);
    formData.append('ar_name', this.newCountry.ar_name);
    formData.append('state', this.newCountry.state);
    formData.append('flag', this.newCountry.flag, this.newCountry.flag.name);

    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_country`, formData)
      .subscribe({
        next: () => {
          this.closeModal('addCountryModal');
          this.getCountry();
          this.showAlert('Success', 'Country added successfully', 'success');
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to add country', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // Edit Country
  openEditCountryModal(country: any): void {
    this.editingCountry = {
      id: country.id,
      en_name: country.en_name,
      ar_name: country.ar_name,
      flag: country.flag,
      currentFlag: country.flag,
      state: country.state,
    };
    this.showModal('editCountryModal');
  }

  onEditFileSelected(event: any): void {
    this.editingCountry.flag = event.target.files[0];
  }
  onFileSelected(event: any): void {
    this.newCountry.flag = event.target.files[0];
  }
  updateCountry(form: NgForm): void {
    if (form.invalid) return;

    const formData = new FormData();
    formData.append('id', this.editingCountry.id!.toString());
    formData.append('en_name', this.editingCountry.en_name);
    formData.append('ar_name', this.editingCountry.ar_name);
    formData.append('state', this.editingCountry.state);

    if (this.editingCountry.flag) {
      formData.append(
        'flag',
        this.editingCountry.flag,
        this.editingCountry.flag.name
      );
    } else {
      formData.append('flag', '');
    }

    const sub = this.callApi
      .updateData(`${environment.API_BASE_URL}/admin/update_country`, formData)
      .subscribe({
        next: () => {
          this.closeModal('editCountryModal');
          this.getCountry();
          this.showAlert('Success', 'Country updated successfully', 'success');
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to update country', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // Add Region
  openAddRegionModal(countryId: number): void {
    this.newRegion = {
      en_name: '',
      ar_name: '',
      country_id: countryId,
    };
    this.showModal('addRegionModal');
  }

  addRegion(form: NgForm): void {
    if (form.invalid || !this.newRegion.country_id) return;

    const sub = this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_region`, this.newRegion)
      .subscribe({
        next: () => {
          this.closeModal('addRegionModal');
          this.getCountry();
          this.showAlert('Success', 'Region added successfully', 'success');
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to add region', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // Edit Region
  openEditRegionModal(region: any, countryId: number): void {
    this.editingRegion = {
      id: region.id,
      en_name: region.en_name,
      ar_name: region.ar_name,
      country_id: countryId,
    };
    this.showModal('editRegionModal');
  }

  updateRegion(form: NgForm): void {
    if (form.invalid || !this.editingRegion.country_id) return;

    const sub = this.callApi
      .updateData(
        `${environment.API_BASE_URL}/admin/update_region`,
        this.editingRegion
      )
      .subscribe({
        next: () => {
          this.closeModal('editRegionModal');
          this.getCountry();
          this.showAlert('Success', 'Region updated successfully', 'success');
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to update region', 'error');
        },
      });
    this.subscriptions.push(sub);
  }

  // Delete Region
  deleteRegion(regionId: number, countryId: number): void {
    this.showConfirm('Are you sure?', 'This will delete the region').then(
      (result) => {
        if (result.isConfirmed) {
          const sub = this.callApi
            .deleteData(
              `${environment.API_BASE_URL}/admin/delete_region`,
              regionId
            )
            .subscribe({
              next: () => {
                const country = this.countries.find((c) => c.id === countryId);
                if (country) {
                  country.regions = country.regions.filter(
                    (r: any) => r.id !== regionId
                  );
                }
                this.showAlert(
                  'Deleted',
                  'Region deleted successfully',
                  'success'
                );
              },
              error: (error) => {
                this.auth.handleError(error);
                this.showAlert('Error', 'Failed to delete region', 'error');
              },
            });
          this.subscriptions.push(sub);
        }
      }
    );
  }

  // Export to Excel
  exportToExcel(): void {
    const exportData: any[] = [];

    this.filteredCountries.forEach((country) => {
      exportData.push({
        'Country ID': country.id,
        'Country Name (EN)': country.en_name,
        'Country Name (AR)': country.ar_name,
        'Country Status': country.state,
        'Country Flag': country.flag
          ? `${environment.API_BASE_URL}/storage/${country.flag}`
          : 'No Flag',
        'Region ID': '',
        'Region Name (EN)': '',
        'Region Name (AR)': '',
      });

      country.regions.forEach((region: any) => {
        exportData.push({
          'Country ID': country.id,
          'Country Name (EN)': country.en_name,
          'Country Name (AR)': country.ar_name,
          'Country Status': '',
          'Country Flag': '',
          'Region ID': region.id,
          'Region Name (EN)': region.en_name,
          'Region Name (AR)': region.ar_name,
        });
      });

      exportData.push({});
    });

    try {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Countries and Regions'
      );
      XLSX.writeFile(workbook, 'Countries_and_Regions.xlsx');
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

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredCountries.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getPaginatedCountries(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCountries.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  // Filter Countries
  filterCountries(): void {
    if (!this.searchTerm) {
      this.filteredCountries = [...this.countries];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCountries = this.countries.filter(
      (country) =>
        country.en_name.toLowerCase().includes(term) ||
        country.ar_name.includes(term) ||
        country.id.toString().includes(term)
    );
    this.currentPage = 1;
  }

  // Modal Helpers
  private showModal(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  private closeModal(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modal = Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Alert Helpers
  private showAlert(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning' | 'info'
  ): void {
    Swal.fire({ title, text, icon, confirmButtonText: 'OK' });
  }

  private showConfirm(title: string, text: string): Promise<any> {
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
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
