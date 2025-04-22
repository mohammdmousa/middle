import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-statistics',
  standalone: false,
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
})
export class StatisticsComponent {
  companies: any[] = [
    {
      id: 1,
      en_name: 'Tech Solutions Inc.',
      logo: 'assets/logos/tech-solutions.png',
      stats: {
        active_jobs: 15,
        pending_jobs: 3,
        applications: 245,
        views: 1200,
        shares: 85,
        last_activity: new Date('2023-06-15'),
      },
    },
    {
      id: 2,
      en_name: 'Global Marketing',
      logo: 'assets/logos/global-marketing.png',
      stats: {
        active_jobs: 8,
        pending_jobs: 2,
        applications: 120,
        views: 850,
        shares: 42,
        last_activity: new Date('2023-06-10'),
      },
    },
    {
      id: 3,
      en_name: 'Saudi Finance House',
      logo: 'assets/logos/sfh.png',
      stats: {
        active_jobs: 12,
        pending_jobs: 1,
        applications: 180,
        views: 950,
        shares: 35,
        last_activity: new Date('2023-06-12'),
      },
    },
    {
      id: 4,
      en_name: 'Construction Plus',
      logo: null,
      stats: {
        active_jobs: 5,
        pending_jobs: 0,
        applications: 75,
        views: 420,
        shares: 18,
        last_activity: new Date('2023-05-28'),
      },
    },
  ];

  // Filtering and pagination
  filteredCompanies: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  dateFrom: string = '';
  dateTo: string = '';
  url: string = environment.API_BASE_URL;

  // Summary statistics
  get totalCompanies(): number {
    return this.filteredCompanies.length;
  }

  get activeCompanies(): number {
    return this.filteredCompanies.filter((c) => c.stats.active_jobs > 0).length;
  }

  get totalJobs(): number {
    return this.filteredCompanies.reduce(
      (sum, company) =>
        sum + company.stats.active_jobs + company.stats.pending_jobs,
      0
    );
  }

  get totalApplications(): number {
    return this.filteredCompanies.reduce(
      (sum, company) => sum + company.stats.applications,
      0
    );
  }

  constructor() {
    this.filteredCompanies = [...this.companies];
  }

  // Filter companies by search term
  filterCompanies(): void {
    if (!this.searchTerm) {
      this.filteredCompanies = [...this.companies];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCompanies = this.companies.filter((company) =>
      company.en_name.toLowerCase().includes(term)
    );
    this.currentPage = 1;
  }

  // Filter by date range
  filterByDate(): void {
    if (!this.dateFrom && !this.dateTo) {
      this.filteredCompanies = [...this.companies];
      return;
    }

    const fromDate = this.dateFrom ? new Date(this.dateFrom) : null;
    const toDate = this.dateTo ? new Date(this.dateTo) : null;

    this.filteredCompanies = this.companies.filter((company) => {
      const lastActivity = new Date(company.stats.last_activity);
      return (
        (!fromDate || lastActivity >= fromDate) &&
        (!toDate || lastActivity <= toDate)
      );
    });
    this.currentPage = 1;
  }

  // Pagination methods
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

  // View company details
  viewDetails(companyId: number): void {
    // In a real app, this would navigate to company details
    console.log('Viewing details for company:', companyId);
  }

  // Export to Excel
  exportToExcel(): void {
    const exportData = this.filteredCompanies.map((company) => ({
      'Company Name': company.en_name,
      'Active Jobs': company.stats.active_jobs,
      'Pending Jobs': company.stats.pending_jobs,
      Applications: company.stats.applications,
      Views: company.stats.views,
      Shares: company.stats.shares,
      'Last Activity': company.stats.last_activity,
    }));

    try {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Statistics');
      XLSX.writeFile(workbook, 'Company_Statistics.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  }
}
