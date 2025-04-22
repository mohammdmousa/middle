import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  forwardRef,
  Renderer2,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
@Component({
  selector: 'app-rich-text-editor',
  standalone: false,
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @ViewChild('editor') editor!: ElementRef<HTMLElement>;
  @Input() placeholder = 'أدخل النص هنا...';

  private _value = '';
  disabled = false;
  onChange: any = () => {};
  onTouched: any = () => {};

  // الألوان المتاحة
  colors = [
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#00ffff',
    '#ff00ff',
    '#c0c0c0',
    '#808080',
  ];

  // أحجام الخطوط
  fontSizes = [
    { name: 'صغير (12px)', value: '1' },
    { name: 'عادي (16px)', value: '3' },
    { name: 'كبير (20px)', value: '5' },
    { name: 'كبير جداً (24px)', value: '7' },
  ];

  constructor(private renderer: Renderer2) {}

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  writeValue(value: string): void {
    this._value = value || '';
    if (this.editor) {
      this.renderer.setProperty(
        this.editor.nativeElement,
        'innerHTML',
        this._value
      );
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onContentChange(event: Event): void {
    this.value = this.editor.nativeElement.innerHTML;
    this.adjustScroll();
  }

  execCommand(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.editor.nativeElement.focus();
    this.onContentChange(new Event('input'));
  }

  handleEnter(event: KeyboardEvent): void {
    event.preventDefault();
    this.execCommand('insertParagraph');
    this.adjustScroll();
  }

  toggleRtl(): void {
    const isRtl = this.editor.nativeElement.style.direction === 'rtl';
    this.editor.nativeElement.style.direction = isRtl ? 'ltr' : 'rtl';
    this.editor.nativeElement.style.textAlign = isRtl ? 'left' : 'right';
  }

  clearFormatting(): void {
    this.execCommand('removeFormat');
    this.execCommand('unlink');
  }

  private adjustScroll(): void {
    setTimeout(() => {
      const editor = this.editor.nativeElement;
      editor.scrollTop = editor.scrollHeight;
    }, 0);
  }
}
