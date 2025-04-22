import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CallapiService } from '../../service/callapi.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

interface Field {
  id?: number;
  category_id: number;
  ar_name: string;
  en_name: string;
  type: string;
  min_length?: number | null;
  max_length?: number | null;
  options?: string[];
  is_required: boolean;
  custom_icon?: string;
  level?: number;
}

interface Category {
  id: number;
  ar_name: string;
  en_name: string;
  children?: Category[];
  level: number;
}

@Component({
  selector: 'app-custom-form',
  standalone: false,
  templateUrl: './custom-form.component.html',
  styleUrl: './custom-form.component.css',
})
export class CustomFormComponent implements OnInit {
  fieldTypes = [
    'text',
    'number',
    'radio',
    'checkbox',
    'select',
    'textarea',
    'date',
    'file',
  ];

  categoriesTree: Category[] = [];
  selectedCategoryId: number | null = null;
  formFields: Field[] = [];
  dynamicForm: FormGroup;
  previewForm: FormGroup;
  submittedData: any = null;
  showValidation = false;
  isSubmitting = false;
  selectedField: Field | null = null;

  constructor(
    private fb: FormBuilder,
    private callApi: CallapiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.dynamicForm = this.fb.group({});
    this.previewForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initForms();
    this.loadCategoriesTree();
  }

  initForms(): void {
    this.dynamicForm = this.fb.group({
      fieldType: ['text', Validators.required],
      en_name: ['', Validators.required],
      ar_name: ['', Validators.required],
      is_required: [false],
      min_length: [null],
      max_length: [null],
      options: [''],
      custom_icon: [''],
    });
  }

  loadCategoriesTree(): void {
    this.callApi
      .getData(`${environment.API_BASE_URL}/admin/categoryTree`)
      .subscribe({
        next: (response: any) => {
          this.categoriesTree = response.allCategories || [];
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.auth.handleError(error);
          Swal.fire('Error', 'Failed to load categories', 'error');
        },
      });
  }

  onCategorySelect(): void {
    if (this.selectedCategoryId) {
      this.loadCategoryFields(this.selectedCategoryId);
    } else {
      this.clearForm();
    }
  }

  loadCategoryFields(categoryId: number): void {
    this.callApi
      .getData(
        `${environment.API_BASE_URL}/admin/category_fields/${categoryId}`
      )
      .subscribe({
        next: (response: any) => {
          this.formFields = response.category.customfields || [];
          this.rebuildPreviewForm();
        },
        error: (error) => {
          this.handleError('Failed to load fields', error);
        },
      });
  }

  onFieldTypeChange(): void {
    const fieldType = this.dynamicForm.get('fieldType')?.value;
    if (!['radio', 'select', 'checkbox'].includes(fieldType)) {
      this.dynamicForm.get('options')?.setValue('');
    }
    if (!['text', 'number', 'textarea'].includes(fieldType)) {
      this.dynamicForm.get('min_length')?.setValue(null);
      this.dynamicForm.get('max_length')?.setValue(null);
    }
  }

  prepareFieldData(): Field {
    const formValue = this.dynamicForm.value;
    const fieldData: Field = {
      category_id: this.selectedCategoryId!,
      type: formValue.fieldType,
      en_name: formValue.en_name,
      ar_name: formValue.ar_name,
      is_required: formValue.is_required,
      custom_icon: formValue.custom_icon,
    };

    if (['text', 'number', 'textarea'].includes(formValue.fieldType)) {
      fieldData.min_length = formValue.min_length;
      fieldData.max_length = formValue.max_length;
    }

    if (['radio', 'select', 'checkbox'].includes(formValue.fieldType)) {
      fieldData.options = formValue.options
        .split('\n')
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);
    }

    return fieldData;
  }

  addField(): void {
    this.showValidation = true;
    if (this.dynamicForm.invalid || !this.selectedCategoryId) {
      return;
    }

    const fieldData = this.prepareFieldData();
    this.isSubmitting = true;

    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/add_field`, fieldData)
      .subscribe({
        next: () => {
          this.showSuccess('تم إضافة الحقل بنجاح');
          this.loadCategoryFields(this.selectedCategoryId!);
          this.resetFieldForm();
        },
        error: (error) => this.handleError('فشل في إضافة الحقل', error),
        complete: () => (this.isSubmitting = false),
      });
  }

  editField(field: Field): void {
    this.selectedField = field;
    this.dynamicForm.patchValue({
      fieldType: field.type,
      en_name: field.en_name,
      ar_name: field.ar_name,
      is_required: field.is_required,
      min_length: field.min_length,
      max_length: field.max_length,
      custom_icon: field.custom_icon,
      options: field.options?.join('\n') || '',
    });
  }

  updateField(): void {
    if (!this.selectedField?.id) return;

    const fieldData = {
      ...this.prepareFieldData(),
      id: this.selectedField.id,
    };

    this.isSubmitting = true;
    this.callApi
      .postData(
        `${environment.API_BASE_URL}/admin/update_field/${this.selectedField.id}`,
        fieldData
      )
      .subscribe({
        next: () => {
          this.showSuccess('تم تحديث الحقل بنجاح');
          this.loadCategoryFields(this.selectedCategoryId!);
          this.cancelEdit();
        },
        error: (error) => this.handleError('فشل في تحديث الحقل', error),
        complete: () => (this.isSubmitting = false),
      });
  }

  deleteField(fieldId: number): void {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من التراجع عن هذا!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    }).then((result) => {
      if (result.isConfirmed) {
        this.callApi
          .deleteData(
            `${environment.API_BASE_URL}/admin/delete_field/${fieldId}`,
            fieldId
          )
          .subscribe({
            next: () => {
              this.showSuccess('تم حذف الحقل بنجاح');
              this.loadCategoryFields(this.selectedCategoryId!);
            },
            error: (error) => this.handleError('فشل في حذف الحقل', error),
          });
      }
    });
  }

  cancelEdit(): void {
    this.selectedField = null;
    this.resetFieldForm();
  }

  resetFieldForm(): void {
    this.dynamicForm.reset({
      fieldType: 'text',
      is_required: false,
    });
    this.showValidation = false;
  }

  rebuildPreviewForm(): void {
    const formGroup: any = {};
    this.formFields.forEach((field) => {
      const validators = [];
      if (field.is_required) validators.push(Validators.required);

      if (field.type === 'text' || field.type === 'textarea') {
        if (field.min_length)
          validators.push(Validators.minLength(field.min_length));
        if (field.max_length)
          validators.push(Validators.maxLength(field.max_length));
      } else if (field.type === 'number') {
        if (field.min_length) validators.push(Validators.min(field.min_length));
        if (field.max_length) validators.push(Validators.max(field.max_length));
      }

      formGroup[field.en_name] = ['', validators];
    });

    this.previewForm = this.fb.group(formGroup);
  }

  onSubmit(): void {
    if (this.previewForm.invalid || !this.selectedCategoryId) {
      this.markFormGroupTouched(this.previewForm);
      return;
    }

    const formData = {
      category_id: this.selectedCategoryId,
      fields: this.formFields.map((field) => ({
        field_id: field.id,
        value: this.previewForm.get(field.en_name)?.value,
      })),
    };

    this.isSubmitting = true;
    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/save_form_data`, formData)
      .subscribe({
        next: (response) => {
          this.showSuccess('تم إرسال النموذج بنجاح');
          this.submittedData = response;
        },
        error: (error) => this.handleError('فشل في إرسال النموذج', error),
        complete: () => (this.isSubmitting = false),
      });
  }

  clearForm(): void {
    this.formFields = [];
    this.previewForm = this.fb.group({});
    this.submittedData = null;
    this.selectedField = null;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
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

  private showSuccess(message: string): void {
    Swal.fire('نجاح', message, 'success');
  }

  private handleError(defaultMessage: string, error: any): void {
    console.error('Error:', error);
    this.auth.handleError(error);
    Swal.fire('خطأ', error.error?.message || defaultMessage, 'error');
    this.isSubmitting = false;
  }
}
