import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Device } from '../../models/device.interface';
import { NetworkService } from '../../services/network.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-device-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 max-w-lg">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Configure Device</h2>
        <button class="text-gray-500 hover:text-gray-700" (click)="close()">
          <i-lucide name="x" class="w-5 h-5"></i-lucide>
        </button>
      </div>
      
      <div class="space-y-4">
        <!-- Device Name -->
        <div>
          <label class="block text-sm font-medium mb-1" for="name">Friendly Name</label>
          <input id="name" type="text" [(ngModel)]="device.name"
                 class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
        </div>
        
        <!-- Device Status -->
        <div>
          <label class="block text-sm font-medium mb-1" for="status">Status</label>
          <select id="status" [(ngModel)]="device.status"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="misbehaving">Misbehaving</option>
          </select>
        </div>

        <!-- Device Notes -->
        <div>
          <label class="block text-sm font-medium mb-1" for="notes">Notes</label>
          <textarea id="notes" [(ngModel)]="device.notes" rows="4"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this device..."></textarea>
        </div>

        <!-- Visibility Toggle -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Show on Network Graph</span>
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  (click)="toggleVisibility()">
            {{device.hidden ? 'Show' : 'Hide'}} Device
          </button>
        </div>

        <!-- Device Information Display -->
        <div class="bg-gray-50 p-4 rounded-lg space-y-2">
          <p class="text-sm">
            <span class="font-medium">IP Address:</span> {{device.ip}}
          </p>
          <p class="text-sm">
            <span class="font-medium">MAC Address:</span> {{device.mac}}
          </p>
          <p class="text-sm">
            <span class="font-medium">Device Type:</span> {{device.type | titlecase}}
          </p>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-6">
        <button class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                (click)="close()">
          Cancel
        </button>
        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                (click)="save()">
          Save Changes
        </button>
      </div>
    </div>
  `
})
export class DeviceConfigComponent {
  constructor(
    private dialogRef: DialogRef<Device>,
    @Inject(DIALOG_DATA) public device: Device,
    private networkService: NetworkService
  ) {}

  toggleVisibility() {
    this.device.hidden = !this.device.hidden;
  }

  save() {
    this.networkService.updateDevice(this.device).subscribe({
      next: () => this.dialogRef.close(this.device),
      error: (error) => console.error('Error updating device:', error)
    });
  }

  close() {
    this.dialogRef.close();
  }
}