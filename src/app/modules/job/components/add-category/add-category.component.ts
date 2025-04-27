import { Component, OnInit } from '@angular/core';
import { CallapiService } from '../../service/callapi.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../../../core/service/auth.service';

@Component({
  selector: 'app-add-category',
  standalone: false,
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.css',
})
export class AddCategoryComponent implements OnInit {
  isSubmitting = false;
  categoriesTree: any[] = [];
  selectedParentId: number = 0;

  category = {
    parent_id: 0,
    en_name: '',
    ar_name: '',
    icon: null as File | null,
    state: 'active',
    sort_order: 0,
  };

  constructor(
    private callApi: CallapiService,
    private router: Router,
    private route: ActivatedRoute,
    private aouth: AuthService
  ) {}
 
  ngOnInit(): void {
    this.loadCategoriesTree();
  }
  showIconField: boolean = true;
  onParentChange(): void {
    // تحديث حالة إظهار حقل الأيقونة
    this.showIconField = this.category.parent_id === 0;

    // إذا لم يكن حقل الأيقونة ظاهراً، قم بمسح أي أيقونة محملة
    if (!this.showIconField) {
      this.category.icon = null;
    }
  }

  loadCategoriesTree(): void {
    this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categoryTree`)
      .subscribe({
        next: (response) => {
          this.categoriesTree = response.allCategories;
        },
        error: (error) => {
          this.aouth.handleError(error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to load categories tree',
            icon: 'error',
          });
        },
      });
  }

  onIconSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.category.icon = event.target.files[0];
    }
  }

  getLevelPrefix(level: number): string {
    if (level === 0) return ''; // لا حاجة لرموز في المستوى الأول
    let prefix = '';
    for (let i = 1; i < level; i++) {
      prefix += '&nbsp;&nbsp;&nbsp;'; // إضافة مسافات لكل مستوى
    }
    prefix += level === 1 ? '├─' : '└─'; // رموز تمييز المستوى
    return prefix;
  }

  // دالة لتوليد ألوان ديناميكية بناءً على المستوى
  getLevelColor(level: number): string {
    const hue = (level * 40) % 360; // تغيير الدرجة اللونية بناءً على المستوى
    return `hsl(${hue}, 70%, 50%)`; // استخدام HSL لإنشاء ألوان مميزة
  }
  // دالة لتوليد ألوان ديناميكية بناءً على المستوى

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    this.isSubmitting = true;

    const formData = new FormData();
    if (this.category.parent_id > 0) {
      formData.append('parent_id', this.category.parent_id.toString());
    }
    formData.append('en_name', this.category.en_name);
    formData.append('ar_name', this.category.ar_name);
    formData.append('state', this.category.state);
    formData.append('sort_order', this.category.sort_order.toString());

    if (this.category.icon) {
      formData.append('icon', this.category.icon, this.category.icon.name);
    }

    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_categoryTree`, formData)
      .subscribe({
        next: (response) => {
          Swal.fire({
            title: 'Success',
            text: 'Category added successfully',
            icon: 'success',
          }).then(() => {
            this.router.navigate(['/dash/job/AllCategories'], {
              relativeTo: this.route,
            });
          });
        },
        error: (error) => {
          console.error('Error adding category:', error);
          Swal.fire({
            title: 'Error',
            text: error.error.message || 'Failed to add category',
            icon: 'error',
          });
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
  }

  onReset(): void {
    this.category = {
      parent_id: 0,
      en_name: '',
      ar_name: '',
      icon: null,
      state: 'active',
      sort_order: 0,
    };
    this.selectedParentId = 0;
  }
}
