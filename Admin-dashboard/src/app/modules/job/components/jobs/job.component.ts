import { Component, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Modal } from 'bootstrap';
import { Subscription } from 'rxjs';
import { CallapiService } from '../../service/callapi.service';
import { AuthService } from '../../../../core/service/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-job',
  standalone: false,
  templateUrl: './job.component.html',
  styleUrl: './job.component.css',
})
export class JobComponent implements OnInit, OnDestroy {
  constructor(private callApi: CallapiService, private auth: AuthService) {}
  Subscription: Subscription[] = [];
  url: string = environment.url;
  categories: any[] = [];
  filteredCategories: any[] = [];
  searchTerm: string = '';
  expandedRows: { [key: number]: boolean } = {};
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // For adding new category
  newCategory = {
    en_name: '',
    ar_name: '',
    icon: null as File | null,
    state: 'active',
  };

  // For editing category
  editCategory = {
    id: null as number | null,
    en_name: '',
    ar_name: '',
    icon: null as File | null,
    currentIcon: '',
    state: 'active',
  };

  // For adding new subcategory
  newSubcategory = {
    en_name: '',
    ar_name: '',
    category_id: null as number | null,
  };

  // For editing subcategory
  editSubcategory = {
    id: null as number | null,
    en_name: '',
    ar_name: '',
    category_id: null as number | null,
  };

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories() {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categories`)
      .subscribe({
        next: (data) => {
          this.categories = data.categories;
          this.filteredCategories = [...this.categories];
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to fetch categories', 'error');
        },
      });
    this.Subscription.push(subscribe);
  }

  openEditCategoryModal(category: any): void {
    this.editCategory = {
      id: category.id,
      en_name: category.en_name,
      ar_name: category.ar_name,
      icon: null,
      currentIcon: category.icon || '',
      state: category.state,
    };
    const modalEl = document.getElementById('editCategoryModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  saveEditCategory(form: NgForm): void {
    if (form.invalid || !this.editCategory.id) return;

    const apiUrl = `${environment.API_BASE_URL}/admin/update_category`;
    const formData = new FormData();

    formData.append('id', this.editCategory.id.toString());
    formData.append('en_name', this.editCategory.en_name);
    formData.append('ar_name', this.editCategory.ar_name);
    formData.append('state', this.editCategory.state);

    if (this.editCategory.icon instanceof File) {
      formData.append(
        'icon',
        this.editCategory.icon,
        this.editCategory.icon.name
      );
    }

    this.callApi.updateData(apiUrl, formData).subscribe({
      next: () => {
        this.closeModal('editCategoryModal');
        this.getCategories();
        this.showAlert('Success', 'Category updated successfully', 'success');
      },
      error: (error) => {
        this.auth.handleError(error);
        this.showAlert('Error', 'Failed to update category', 'error');
      },
    });
  }

  onEditIconSelected(event: any): void {
    this.editCategory.icon = event.target.files[0];
  }

  deleteCategory(id: number): void {
    this.showConfirm(
      'Are you sure?',
      'This will delete the category and all its subcategories'
    ).then((result) => {
      if (result.isConfirmed) {
        const apiUrl = `${environment.API_BASE_URL}/admin/delete_category`;
        this.callApi.deleteData(apiUrl, id).subscribe({
          next: () => {
            this.categories = this.categories.filter(
              (category) => category.id !== id
            );
            this.filteredCategories = [...this.categories];
            this.showAlert(
              'Success',
              'Category deleted successfully',
              'success'
            );
          },
          error: (error) => {
            this.auth.handleError(error);
            this.showAlert('Error', 'Failed to delete category', 'error');
          },
        });
      }
    });
  }

  openEditSubcategoryModal(subcategory: any, categoryId: number): void {
    this.editSubcategory = {
      id: subcategory.id,
      en_name: subcategory.en_name,
      ar_name: subcategory.ar_name,
      category_id: categoryId,
    };
    const modalEl = document.getElementById('editSubcategoryModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  saveEditSubcategory(form: NgForm): void {
    if (form.invalid || !this.editSubcategory.id) return;

    const apiUrl = `${environment.API_BASE_URL}/admin/update_subcategory`;
    const subcategoryToUpdate = {
      id: this.editSubcategory.id,
      en_name: this.editSubcategory.en_name,
      ar_name: this.editSubcategory.ar_name,
      category_id: this.editSubcategory.category_id,
    };

    this.callApi.updateData(apiUrl, subcategoryToUpdate).subscribe({
      next: () => {
        this.closeModal('editSubcategoryModal');
        this.getCategories();
        this.showAlert(
          'Success',
          'Subcategory updated successfully',
          'success'
        );
      },
      error: (error) => {
        this.auth.handleError(error);
        this.showAlert('Error', 'Failed to update subcategory', 'error');
      },
    });
  }

  deleteSubcategory(subcategoryId: number, categoryId: number): void {
    this.showConfirm('Are you sure?', 'This will delete the subcategory').then(
      (result) => {
        if (result.isConfirmed) {
          const apiUrl = `${environment.API_BASE_URL}/admin/delete_subcategory`;
          this.callApi.deleteData(apiUrl, subcategoryId).subscribe({
            next: () => {
              const category = this.categories.find((c) => c.id === categoryId);
              if (category) {
                category.subcategories = category.subcategories.filter(
                  (s: any) => s.id !== subcategoryId
                );
                this.showAlert(
                  'Success',
                  'Subcategory deleted successfully',
                  'success'
                );
              }
            },
            error: (error) => {
              this.auth.handleError(error);
              this.showAlert('Error', 'Failed to delete subcategory', 'error');
            },
          });
        }
      }
    );
  }

  // Pagination Logic
  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginatedCategories(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCategories.slice(startIndex, endIndex);
  }

  filterCategories(): void {
    if (!this.searchTerm) {
      this.filteredCategories = [...this.categories];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCategories = this.categories.filter(
      (category) =>
        category.en_name.toLowerCase().includes(term) ||
        category.ar_name.includes(term) ||
        category.id.toString().includes(term)
    );
  }

  toggleRow(id: number): void {
    this.expandedRows[id] = !this.expandedRows[id];
  }

  isExpanded(id: number): boolean {
    return this.expandedRows[id];
  }

  toggleCategoryState(id: number): void {
    const category = this.categories.find((c) => c.id === id);
    if (category) {
      category.state = category.state === 'active' ? 'inactive' : 'active';

      const apiUrl = `${environment.API_BASE_URL}/admin/update_category`;
      const formData = new FormData();
      formData.append('id', category.id.toString());
      formData.append('en_name', category.en_name);
      formData.append('ar_name', category.ar_name);
      formData.append('state', category.state);

      this.callApi.updateData(apiUrl, formData).subscribe({
        next: () => {
          this.showAlert('Success', 'Category status updated', 'success');
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to update category status', 'error');
        },
      });
    }
  }

  exportToExcel(): void {
    const exportData: any[] = [];

    this.filteredCategories.forEach((category) => {
      exportData.push({
        'Category ID': category.id,
        'Category Name (EN)': category.en_name,
        'Category Name (AR)': category.ar_name,
        'Category Status': category.state,
        'Category Icon': category.icon
          ? `${environment.API_BASE_URL}/storage/${category.icon}`
          : 'No Icon',
        'Subcategory ID': '',
        'Subcategory Name (EN)': '',
        'Subcategory Name (AR)': '',
      });

      category.subcategories.forEach((subcategory: any) => {
        exportData.push({
          'Category ID': category.id,
          'Category Name (EN)': category.en_name,
          'Category Name (AR)': category.ar_name,
          'Category Status': '',
          'Category Icon': '',
          'Subcategory ID': subcategory.id,
          'Subcategory Name (EN)': subcategory.en_name,
          'Subcategory Name (AR)': subcategory.ar_name,
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
        'Categories and Subcategories'
      );
      XLSX.writeFile(workbook, 'Categories_and_Subcategories.xlsx');
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

  openAddCategoryModal(): void {
    this.newCategory = {
      en_name: '',
      ar_name: '',
      icon: null,
      state: 'active',
    };
    const modalEl = document.getElementById('addCategoryModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  openAddSubcategoryModal(categoryId: number): void {
    this.newSubcategory = {
      en_name: '',
      ar_name: '',
      category_id: categoryId,
    };
    const modalEl = document.getElementById('addSubcategoryModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  onIconSelected(event: any): void {
    this.newCategory.icon = event.target.files[0];
  }

  addCategory(form: NgForm): void {
    if (form.invalid) return;

    const formData = new FormData();
    formData.append('en_name', this.newCategory.en_name);
    formData.append('ar_name', this.newCategory.ar_name);
    formData.append('state', this.newCategory.state);

    if (this.newCategory.icon) {
      formData.append(
        'icon',
        this.newCategory.icon,
        this.newCategory.icon.name
      );
    }

    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_category`, formData)
      .subscribe({
        next: () => {
          this.closeModal('addCategoryModal');
          this.getCategories();
          this.showAlert('Success', 'Category added successfully', 'success');
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to add category', 'error');
        },
      });
  }

  addSubcategory(form: NgForm): void {
    if (form.invalid || !this.newSubcategory.category_id) return;

    this.callApi
      .postData(
        `${environment.API_BASE_URL}/admin/add_subcategory`,
        this.newSubcategory
      )
      .subscribe({
        next: () => {
          this.closeModal('addSubcategoryModal');
          this.getCategories();
          this.showAlert(
            'Success',
            'Subcategory added successfully',
            'success'
          );
        },
        error: (error) => {
          this.showAlert('Error', 'Failed to add subcategory', 'error');
        },
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
