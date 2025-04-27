import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CallapiService } from '../../service/callapi.service';
import { environment } from '../../../../../environments/environment';
import * as L from 'leaflet';

@Component({
  selector: 'app-details-acution',
  standalone: false,
  templateUrl: './details-acution.component.html',
  styleUrl: './details-acution.component.css',
})
export class DetailsAcutionComponent {
  isLoading: boolean = true;
  auctionId: number = 0;
  auctionDetails: any;
  url: string = environment.url;
  descrption: any = '';
  private map: any;

  constructor(private route: ActivatedRoute, private callApi: CallapiService) {}

  ngOnInit(): void {
    this.auctionId = +this.route.snapshot.params['id'];
    this.loadAuctionDetails();
  }

  ngAfterViewInit(): void {
    // سيتم استدعاء initMap بعد تحميل البيانات
  }

  loadAuctionDetails(): void {
    this.callApi
      .getData(
        `${environment.API_BASE_URL}/admin/view_auction/${this.auctionId}`
      )
      .subscribe({
        next: (response) => {
          this.auctionDetails = response.auction;
          this.descrption = response.auction.description;
          this.isLoading = false;

          // تهيئة الخريطة بعد تحميل البيانات
          setTimeout(() => this.initMap(), 100);
        },
        error: (error) => {
          console.error('Error loading auction details:', error);
          this.isLoading = false;
        },
      });
  }

  private initMap(): void {
    if (!this.auctionDetails?.latitude || !this.auctionDetails?.longitude)
      return;

    // إصلاح مشكلة أيقونات العلامة
    this.fixMarkerIcons();

    const lat = parseFloat(this.auctionDetails.latitude);
    const lng = parseFloat(this.auctionDetails.longitude);

    this.map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // إضافة علامة على الموقع
    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`<b>موقع المزاد</b><br>${this.auctionDetails.name}`)
      .openPopup();

    // إضافة دائرة لتحديد الموقع بدقة
    L.circle([lat, lng], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.2,
      radius: 100, // نصف القطر بالمتر
    }).addTo(this.map);
  }

  private fixMarkerIcons(): void {
    const iconDefault = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'active':
        return 'نشط';
      case 'completed':
        return 'منتهي';
      default:
        return status;
    }
  }
}
