import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-dash',
  standalone: false,
  templateUrl: './dash.component.html',
  styleUrl: './dash.component.css',
})
export class DashComponent {
  constructor(private renderer: Renderer2, private authService: AuthService) {}
  logout(event: Event): void {
    event.preventDefault(); // منع السلوك الافتراضي للرابط
    this.authService.logout();
  }
  ngOnInit() {
    this.initSidebarToggle();
  }

  initSidebarToggle() {
    // Select elements using Angular's Renderer2
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleTop = document.getElementById('sidebarToggleTop');
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebarToggleTop && body && sidebar) {
      // Toggle sidebar on click
      this.renderer.listen(sidebarToggle, 'click', () =>
        this.toggleSidebar(body, sidebar)
      );
      this.renderer.listen(sidebarToggleTop, 'click', () =>
        this.toggleSidebar(body, sidebar)
      );
    }
  }

  toggleSidebar(body: HTMLElement, sidebar: Element) {
    body.classList.toggle('sidebar-toggled');
    sidebar.classList.toggle('toggled');

    if (sidebar.classList.contains('toggled')) {
      const collapses = sidebar.querySelectorAll('.collapse');
      collapses.forEach((collapse: any) => {
        this.renderer.removeClass(collapse, 'show');
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');

    if (window.innerWidth < 768) {
      const collapses = sidebar?.querySelectorAll('.collapse');
      collapses?.forEach((collapse: any) => {
        this.renderer.removeClass(collapse, 'show');
      });
    }

    if (
      window.innerWidth < 480 &&
      sidebar &&
      !sidebar.classList.contains('toggled')
    ) {
      body.classList.add('sidebar-toggled');
      sidebar.classList.add('toggled');
      const collapses = sidebar.querySelectorAll('.collapse');
      collapses.forEach((collapse: any) => {
        this.renderer.removeClass(collapse, 'show');
      });
    }
  }
}
