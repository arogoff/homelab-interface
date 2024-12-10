export interface Device {
  id: string;
  name: string;
  type: string;  // 'router' | 'server' | 'laptop' | 'desktop' etc.
  status: string;  // 'up' | 'down' | 'misbehaving'
  ip: string;
  mac: string;
  hidden?: boolean;
  // These are optional properties used by D3
  notes?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link {
  source: string;
  target: string;
}

export interface D3Link extends d3.SimulationLinkDatum<Device> {
  source: Device;
  target: Device;
}

export interface NetworkNode extends Device, d3.SimulationNodeDatum {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}