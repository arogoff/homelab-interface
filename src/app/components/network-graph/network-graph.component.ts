import { Dialog } from "@angular/cdk/dialog";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID, Component } from "@angular/core";
import * as d3 from "d3";
import { LucideAngularModule } from "lucide-angular";
import { BehaviorSubject, Subscription, combineLatest } from "rxjs";
import { Device, Link, D3Link, NetworkNode } from "../../models/device.interface";
import { NetworkService } from "../../services/network.service";
import { DeviceConfigComponent } from "../device-config/device-config.component";

// Define the D3 Link type with proper type arguments
// type D3Selection = d3.Selection<SVGGElement, unknown, null, undefined>;
// type SimulationNode = d3.SimulationNodeDatum & Device;
// type SimulationLink = d3.SimulationLinkDatum<SimulationNode>;
type D3Selection = d3.Selection<SVGGElement, unknown, null, undefined>;
type SimulationLink = d3.SimulationLinkDatum<NetworkNode>;

@Component({
  selector: 'app-network-graph',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  styles: [`
    .device-card {
      width: 300px;
      position: absolute;
      transition: transform 0.15s ease;
      pointer-events: all;
      cursor: move;
    }

    .link {
      stroke: #999;
      stroke-opacity: 0.6;
      stroke-width: 2;
      stroke-dasharray: 4;
      animation: dash 20s linear infinite;
    }

    @keyframes dash {
      to {
        stroke-dashoffset: 1000;
      }
    }

    .link-router {
      stroke: #2563eb;
      stroke-width: 3;
    }

    .link-server {
      stroke: #059669;
      stroke-width: 2.5;
    }

    .link-default {
      stroke: #6b7280;
      stroke-width: 2;
    }

    .status-up {
      @apply bg-green-500;
    }

    .status-down {
      @apply bg-red-500;
    }

    .status-misbehaving {
      @apply bg-yellow-500;
    }
  `],
  template: `
    <div class="w-full h-screen relative bg-slate-50 overflow-hidden">
      <svg #svg class="w-full h-full absolute top-0 left-0">
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 -5 10 10"
            refX="20"
            refY="0"
            markerWidth="6"
            markerHeight="6"
            orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#999"/>
          </marker>
        </defs>
        <g class="zoom-container">
          <g class="links"></g>
          <g class="nodes"></g>
        </g>
      </svg>

      <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div *ngFor="let device of devices$ | async"
             [id]="'device-' + device.id"
             [style.transform]="getDevicePosition(device)"
             class="device-card"
             [class.hidden]="device.hidden">
          <div class="bg-white rounded-lg shadow-lg p-4">
            <!-- Header -->
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <div [class]="'w-3 h-3 rounded-full ' + getStatusClass(device)"></div>
                <h3 class="font-medium">{{ device.name }}</h3>
              </div>
              <button (click)="openConfig(device)" 
                      class="text-gray-500 hover:text-gray-700 pointer-events-auto">
                Settings
              </button>
            </div>

            <!-- Device Info -->
            <div class="space-y-2 mb-4 text-sm">
              <p class="text-gray-600">
                <span class="font-medium">Status:</span> {{ device.status | titlecase }}
              </p>
              <p class="text-gray-600">
                <span class="font-medium">IP:</span> {{ device.ip }}
              </p>
              <p class="text-gray-600">
                <span class="font-medium">MAC:</span> {{ device.mac }}
              </p>
              <div *ngIf="device.notes" class="mt-2 p-2 bg-gray-50 rounded text-sm">
                <p class="font-medium mb-1">Notes:</p>
                <p class="text-gray-600">{{ device.notes }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                class="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm pointer-events-auto"
                (click)="openTerminal(device)">
                Terminal
              </button>
              <button
                class="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm pointer-events-auto"
                (click)="openRemoteDesktop(device)">
                Console
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NetworkGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svg') svgElement!: ElementRef;

  devices$ = new BehaviorSubject<Device[]>([]);
  private links$ = new BehaviorSubject<Link[]>([]);
  private simulation!: d3.Simulation<NetworkNode, SimulationLink>;
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private container!: D3Selection;
  private isViewInitialized = false;
  private subscription: Subscription = new Subscription();
  private resizeObserver: ResizeObserver | null = null;
  private isBrowser: boolean;

  constructor(
    private networkService: NetworkService,
    private dialog: Dialog,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private initializeSimulation(width: number, height: number) {
    this.simulation = d3.forceSimulation<NetworkNode>()
      .force('link', d3.forceLink<NetworkNode, SimulationLink>().id(d => d.id).distance(350))
      .force('charge', d3.forceManyBody().strength(-2000))
      .force('collision', d3.forceCollide().radius(175))
      .force('center', d3.forceCenter(width / 2, height / 2));
  }

  ngOnInit() {
    this.loadData();

    this.subscription.add(
      combineLatest([this.devices$, this.links$]).subscribe(
        ([devices, links]) => {
          if (this.isViewInitialized && devices.length && links.length) {
            this.updateGraph();
          }
        }
      )
    );
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.isViewInitialized = true;
    this.initializeGraph();

    if (this.devices$.value.length && this.links$.value.length) {
      this.updateGraph();
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.isViewInitialized) {
          this.updateGraph();
        }
      });

      this.resizeObserver.observe(this.svgElement.nativeElement);
    }

    // Initialize drag behavior for all device cards
    this.devices$.value.forEach(device => {
      const element = document.getElementById(`device-${device.id}`);
      if (element) {
        this.makeCardDraggable(element, device);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initializeGraph() {
    if (!this.svgElement?.nativeElement) return;

    const svg = d3.select(this.svgElement.nativeElement);
    const width = this.svgElement.nativeElement.clientWidth;
    const height = this.svgElement.nativeElement.clientHeight;

    svg.selectAll('*').remove();

    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        this.container.attr('transform', event.transform);
      });

    svg.call(this.zoom);

    this.container = svg.select('.zoom-container');

    this.initializeSimulation(width, height);
  }

  getDevicePosition(device: Device): string {
    if (!device.x || !device.y) return 'translate(0, 0)';
    return `translate(${device.x - 150}px, ${device.y - 100}px)`;
  }

  private updateGraph() {
    if (!this.svgElement?.nativeElement) return;

    const devices = this.devices$.value.filter(d => !d.hidden) as NetworkNode[];
    const links = this.links$.value;
    
    // Convert links to simulation links with proper node references
    const simulationLinks = links.map(link => {
      const source = devices.find(d => d.id === link.source);
      const target = devices.find(d => d.id === link.target);
      
      if (!source || !target) return null;

      return {
        source,
        target,
        index: undefined
      } as SimulationLink;
    }).filter((link): link is SimulationLink => link !== null);

    if (!devices.length || !simulationLinks.length) return;

    // Update links
    const linkElements = this.container
      .select('.links')
      .selectAll('line')
      .data(simulationLinks)
      .join('line')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrowhead)');

    // Update simulation
    this.simulation
      .nodes(devices)
      .force('link', d3.forceLink<NetworkNode, SimulationLink>(simulationLinks)
        .id(d => d.id)
        .distance(350))
      .on('tick', () => {
        // Update link positions
        linkElements
          .attr('x1', d => (d.source as NetworkNode).x!)
          .attr('y1', d => (d.source as NetworkNode).y!)
          .attr('x2', d => (d.target as NetworkNode).x!)
          .attr('y2', d => (d.target as NetworkNode).y!);

        // Trigger change detection
        this.devices$.next([...devices]);
      });

    // Restart simulation
    this.simulation.alpha(1).restart();
  }

  private makeCardDraggable(element: HTMLElement, device: Device) {
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    const dragStart = (e: MouseEvent) => {
      if (e.target instanceof HTMLButtonElement) return;
      
      e.preventDefault();
      initialX = e.clientX;
      initialY = e.clientY;
      
      isDragging = true;
      element.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
    };

    const drag = (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      initialX = e.clientX;
      initialY = e.clientY;

      // Update device position
      device.x! += currentX;
      device.y! += currentY;
      
      // Fix position during drag
      device.fx = device.x;
      device.fy = device.y;

      // Restart simulation
      this.simulation.alpha(1).restart();
    };

    const dragEnd = () => {
      isDragging = false;
      element.style.cursor = 'move';
      
      // Release fixed position
      device.fx = null;
      device.fy = null;

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
    };

    element.addEventListener('mousedown', dragStart);
  }

  public getStatusClass(device: Device): string {
    switch (device.status) {
      case 'down':
        return 'status-down';
      case 'misbehaving':
        return 'status-misbehaving';
      default:
        return 'status-up';
    }
  }

  openConfig(device: Device) {
    const dialogRef = this.dialog.open<Device>(DeviceConfigComponent, {
      data: device,
    });

    dialogRef.closed.subscribe({
      next: (result?: Device) => {
        if (result) {
          const devices = this.devices$.value;
          const index = devices.findIndex(d => d.id === result.id);
          if (index !== -1) {
            devices[index] = result;
            this.devices$.next(devices);
          }
        }
      }
    });
  }

  openTerminal(device: Device) {
    console.log(`Opening terminal for ${device.name}`);
  }

  openRemoteDesktop(device: Device) {
    console.log(`Opening remote console for ${device.name}`);
  }

  private loadData() {
    this.subscription.add(
      this.networkService.getDevices().subscribe({
        next: (devices) => {
          // Convert Device[] to NetworkNode[]
          const networkNodes: NetworkNode[] = devices.map(device => ({
            ...device,
            x: undefined,
            y: undefined,
            fx: null,
            fy: null
          }));
          this.devices$.next(networkNodes);
        },
        error: (error) => console.error('Error loading devices:', error),
      })
    );

    this.subscription.add(
      this.networkService.getLinks().subscribe({
        next: (links) => this.links$.next(links),
        error: (error) => console.error('Error loading links:', error),
      })
    );
  }
}