export interface GeofenceZone {
  id: string;
  name: string;
  description: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number; // in meters
  type: 'safe' | 'restricted' | 'warning';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
}

export interface UserLocation {
  userId: string;
  userName: string;
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  isInside: boolean;
  violatedZones: string[];
}

export interface GeofenceViolation {
  id: string;
  userId: string;
  userName: string;
  zoneId: string;
  zoneName: string;
  violationType: 'enter' | 'exit';
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
  isResolved: boolean;
}

export interface GeofenceConfig {
  trackingInterval: number; // in milliseconds
  alertsEnabled: boolean;
  autoAlerts: boolean;
  notificationSound: boolean;
}