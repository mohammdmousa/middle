import { Component } from '@angular/core';
import { CallapiService } from '../../service/callapi.service';
import { AuthService } from '../../../../core/service/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Modal } from 'bootstrap';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface Category {
  id: number;
  en_name: string;
  ar_name: string;
  icon: string | null;
  state: string;
  sort_order: number;
  parent_id: number | null;
  children?: Category[];
  level: number;
  expanded?: boolean;
  _lft?: number;
  _rgt?: number;
}
@Component({
  selector: 'app-all-categories',
  standalone: false,
  templateUrl: './all-categories.component.html',
  styleUrl: './all-categories.component.css',
})
export class AllCategoriesComponent {
  constructor(private callApi: CallapiService, private auth: AuthService) {}

  subscriptions: Subscription[] = [];
  url: string = environment.url;
  allCategories: Category[] = [];
  displayedCategories: Category[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  editCategory = {
    id: null as number | null,
    en_name: '',
    ar_name: '',
    icon: null as File | null,
    currentIcon: '',
    state: 'active',
    parent_id: null as number | null,
    sort_order: 0,
  };

  ngOnInit(): void {
    this.getCategories();
  }

  getIndentationArray(level: number): any[] {
    return new Array(level).fill(0);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getCategories(): void {
    const subscribe = this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categoryTree`)
      .subscribe({
        next: (data) => {
          this.allCategories = data.allCategories;
          this.buildHierarchy();
          this.filterCategories();
        },
        error: (error) => {
          this.auth.handleError(error);
          this.showAlert('Error', 'Failed to fetch categories', 'error');
        },
      });
    this.subscriptions.push(subscribe);
  }

  buildHierarchy(): void {
    this.allCategories.forEach((category) => {
      category.level = 0;
      category.expanded = false;
    });

    const map = new Map<number, Category>();
    this.allCategories.forEach((category) => map.set(category.id, category));

    const rootCategories: Category[] = [];

    this.allCategories.forEach((category) => {
      if (category.parent_id !== null) {
        const parent = map.get(category.parent_id);
        if (parent) {
          category.level = (parent.level || 0) + 1;
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    rootCategories.forEach((category) => {
      if (category.children) {
        category.children.sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );
      }
    });

    this.displayedCategories = rootCategories.sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );
  }

  toggleExpand(category: Category): void {
    category.expanded = !category.expanded;
  }

  filterCategories(): void {
    if (!this.searchTerm) {
      this.buildHierarchy();
      return;
    }

    const term = this.searchTerm.toLowerCase();

    // دالة مساعدة للبحث في الفئة وأبنائها
    const searchInCategory = (category: Category): boolean => {
      // تحقق من تطابق الفئة الحالية
      const isMatch =
        category.en_name.toLowerCase().includes(term) ||
        category.ar_name.toLowerCase().includes(term) ||
        category.id.toString().includes(term);

      // إذا كان لها أبناء، ابحث فيهم
      if (category.children && category.children.length > 0) {
        const childMatch = category.children.some((child) =>
          searchInCategory(child)
        );
        return isMatch || childMatch;
      }

      return isMatch;
    };

    // إنشاء نسخة من الهيكل الهرمي مع الفئات المطابقة فقط
    const filterHierarchy = (categories: Category[]): Category[] => {
      return categories
        .filter((category) => searchInCategory(category))
        .map((category) => {
          const cloned = { ...category };
          if (cloned.children) {
            cloned.children = filterHierarchy(cloned.children);
            cloned.expanded = cloned.children.length > 0; // توسيع الفئات التي تحتوي على أبناء مطابقين
          }
          return cloned;
        });
    };

    // تطبيق الفلتر على الفئات الجذرية
    const filteredRootCategories = filterHierarchy(
      this.allCategories.filter((c) => c.parent_id === null)
    );

    // فرز النتائج
    filteredRootCategories.sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );
    filteredRootCategories.forEach((category) => {
      if (category.children) {
        category.children.sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );
      }
    });

    this.displayedCategories = filteredRootCategories;
  }

  private cloneCategory(category: Category): Category {
    return {
      ...category,
      children: [],
      expanded: true,
    };
  }

  private filterCategoryChildren(
    category: Category,
    categoriesToShow: Set<number>
  ) {
    if (!category.children) return;

    category.children = this.allCategories
      .filter((c) => c.parent_id === category.id && categoriesToShow.has(c.id))
      .map((c) => {
        const cloned = this.cloneCategory(c);
        this.filterCategoryChildren(cloned, categoriesToShow);
        return cloned;
      });
  }

  getVisibleCategories(): Category[] {
    const visible: Category[] = [];

    const addVisible = (categories: Category[]) => {
      categories.forEach((category) => {
        visible.push(category);
        if (category.expanded && category.children) {
          addVisible(category.children);
        }
      });
    };

    addVisible(this.displayedCategories);
    return visible;
  }

  openEditCategoryModal(category: Category): void {
    this.editCategory = {
      id: category.id,
      en_name: category.en_name,
      ar_name: category.ar_name,
      icon: null,
      currentIcon: category.parent_id ? '' : category.icon || '',
      state: category.state,
      parent_id: category.parent_id,
      sort_order: category.sort_order,
    };
    const modalEl = document.getElementById('editCategoryModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  onEditIconSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editCategory.icon = file;
    }
  }

  saveEditCategory(form: NgForm): void {
    if (form.invalid || !this.editCategory.id) return;

    const apiUrl = `${environment.API_BASE_URL}/admin/update_categoryTree`;
    const formData = new FormData();

    formData.append('id', this.editCategory.id.toString());
    formData.append('en_name', this.editCategory.en_name);
    formData.append('ar_name', this.editCategory.ar_name);
    formData.append('state', this.editCategory.state);
    formData.append('sort_order', this.editCategory.sort_order.toString());

    if (this.editCategory.parent_id) {
      formData.append('parent_id', this.editCategory.parent_id.toString());
    }

    if (
      !this.editCategory.parent_id &&
      this.editCategory.icon instanceof File
    ) {
      formData.append(
        'icon',
        this.editCategory.icon,
        this.editCategory.icon.name
      );
    } else {
      formData.append('icon', '');
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

  deleteCategory(id: number): void {
    this.showConfirm(
      'Are you sure?',
      'This will delete the category and all its subcategories'
    ).then((result) => {
      if (result.isConfirmed) {
        const apiUrl = `${environment.API_BASE_URL}/admin/delete_categoryTree`;
        this.callApi.deleteData(apiUrl, id).subscribe({
          next: () => {
            this.allCategories = this.allCategories.filter(
              (category) => category.id !== id
            );
            this.buildHierarchy();
            this.filterCategories();
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

  toggleCategoryState(id: number): void {
    const category = this.allCategories.find((c) => c.id === id);
    if (category) {
      category.state = category.state === 'active' ? 'inactive' : 'active';

      const apiUrl = `${environment.API_BASE_URL}/admin/update_categoryTree`;
      const formData = new FormData();
      formData.append('id', category.id.toString());
      formData.append('en_name', category.en_name);
      formData.append('ar_name', category.ar_name);
      formData.append('state', category.state);
      formData.append('sort_order', category.sort_order.toString());
      if (category.parent_id) {
        formData.append('parent_id', category.parent_id.toString());
      }

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

    const addCategoryToExport = (category: Category, levelPrefix = '') => {
      exportData.push({
        ID: category.id,
        Level: levelPrefix,
        'Name (EN)': category.en_name,
        'Name (AR)': category.ar_name,
        Status: category.state,
        'Sort Order': category.sort_order,
        Icon:
          category.icon && !category.parent_id
            ? `${environment.API_BASE_URL}/storage/${category.icon}`
            : 'No Icon',
        'Parent ID': category.parent_id || 'None',
      });

      if (category.children) {
        category.children.forEach((child) =>
          addCategoryToExport(child, levelPrefix + '--')
        );
      }
    };

    this.displayedCategories.forEach((category) =>
      addCategoryToExport(category)
    );

    try {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
      XLSX.writeFile(workbook, 'Categories_Hierarchy.xlsx');
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

  get totalPages(): number {
    return Math.ceil(this.getVisibleCategories().length / this.itemsPerPage);
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
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
