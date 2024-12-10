import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NetworkGraphComponent],
  template: `
    <app-network-graph></app-network-graph>
  `
})
export class AppComponent {
  title = 'network-app';
}
