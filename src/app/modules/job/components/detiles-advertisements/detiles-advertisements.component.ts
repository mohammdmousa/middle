import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { CallapiService } from '../../service/callapi.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-detiles-advertisements',
  standalone: false,
  templateUrl: './detiles-advertisements.component.html',
  styleUrl: './detiles-advertisements.component.css',
})
export class DetilesAdvertisementsComponent {
  isLoading: boolean = true;
  private map: any;
  private marker: any;
  constructor(private route: ActivatedRoute, private callApi: CallapiService) {}
  adId: number = 0;
  adDetails: any;
  url: string = environment.url;

  ngOnInit(): void {
    this.adId = +this.route.snapshot.params['id'];
    this.loadAdDetails();
  }

  loadAdDetails(): void {
    this.callApi
      .postData(`${environment.API_BASE_URL}/admin/view_ad`, {
        id: this.adId,
      })
      .subscribe({
        next: (response) => {
          this.adDetails = response.ad;
          this.isLoading = false;
          setTimeout(() => this.initMap(), 100);
        },
        error: (error) => {
          console.error('Error loading ad details:', error);
          this.isLoading = false;
        },
      });
  }

  private initMap(): void {
    if (!this.adDetails?.latitude || !this.adDetails?.longitude) return;

    const lat = parseFloat(this.adDetails.latitude);
    const lng = parseFloat(this.adDetails.longitude);

    // إنشاء الخريطة
    this.map = L.map('detailsMap').setView([lat, lng], 15);

    // إضافة طبقة الخريطة
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // إضافة علامة على الموقع
    this.marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`<b>موقع الإعلان</b><br>${this.adDetails.name}`)
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
}
