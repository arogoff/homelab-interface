import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Device, Link } from '../models/device.interface';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private apiUrl = 'api/network'; // Replace with your actual API endpoint

  constructor(private http: HttpClient) {}

  getDevices(): Observable<Device[]> {
    // TODO: Replace with actual API call
    return of([
      { 
        id: '1', 
        name: 'Router', 
        type: 'router',
        ip: '192.168.1.1', 
        mac: '00:11:22:33:44:55', 
        status: 'up' 
      },
      { 
        id: '2', 
        name: 'Laptop', 
        type: 'laptop',
        ip: '192.168.1.100', 
        mac: 'AA:BB:CC:DD:EE:FF', 
        status: 'up' 
      },
      { 
        id: '3', 
        name: 'Server', 
        type: 'server',
        ip: '192.168.1.101', 
        mac: '11:22:33:44:55:66', 
        status: 'misbehaving' 
      },
      { 
        id: '4', 
        name: 'Desktop', 
        type: 'desktop',
        ip: '192.168.1.102', 
        mac: 'AA:11:BB:22:CC:33', 
        status: 'down' 
      }
    ]);
  }

  getLinks(): Observable<Link[]> {
    // TODO: Replace with actual API call
    return of([
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '1', target: '4' },
      { source: '3', target: '4' }  // Added a link between server and desktop
    ]);
  }

  updateDevice(device: Device): Observable<Device> {
    return this.http.put<Device>(`${this.apiUrl}/devices/${device.id}`, device);
  }
}