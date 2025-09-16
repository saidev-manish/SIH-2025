import { GeofenceZone, UserLocation, GeofenceViolation } from '../types/geofence';

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Check if a point is inside a geofence zone
export function isInsideGeofence(
  userLat: number,
  userLng: number,
  zone: GeofenceZone
): boolean {
  const distance = calculateDistance(
    userLat,
    userLng,
    zone.center.lat,
    zone.center.lng
  );
  return distance <= zone.radius;
}

// Check all geofence violations for a user
export function checkGeofenceViolations(
  userLocation: UserLocation,
  geofenceZones: GeofenceZone[]
): {
  violations: GeofenceViolation[];
  currentZones: string[];
} {
  const violations: GeofenceViolation[] = [];
  const currentZones: string[] = [];

  geofenceZones.forEach(zone => {
    if (!zone.isActive) return;

    const isInside = isInsideGeofence(
      userLocation.lat,
      userLocation.lng,
      zone
    );

    if (isInside) {
      currentZones.push(zone.id);
    }

    // Check for violations based on zone type
    if (zone.type === 'restricted' && isInside) {
      violations.push({
        id: `${userLocation.userId}-${zone.id}-${Date.now()}`,
        userId: userLocation.userId,
        userName: userLocation.userName,
        zoneId: zone.id,
        zoneName: zone.name,
        violationType: 'enter',
        timestamp: new Date(),
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        isResolved: false
      });
    }
  });

  return { violations, currentZones };
}

// Generate mock geofence zones for demonstration
export function generateMockGeofences(): GeofenceZone[] {
  return [
    {
      id: 'gf-001',
      name: 'Office Campus',
      description: 'Main office building and surrounding area',
      center: { lat: 28.6139, lng: 77.2090 }, // Delhi
      radius: 500,
      type: 'safe',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      color: '#10B981'
    },
    {
      id: 'gf-002',
      name: 'Restricted Area - Server Room',
      description: 'High security zone - authorized personnel only',
      center: { lat: 28.6129, lng: 77.2080 },
      radius: 100,
      type: 'restricted',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      color: '#EF4444'
    },
    {
      id: 'gf-003',
      name: 'Warning Zone - Construction',
      description: 'Construction area - exercise caution',
      center: { lat: 28.6149, lng: 77.2100 },
      radius: 200,
      type: 'warning',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      color: '#F59E0B'
    },
    {
      id: 'gf-004',
      name: 'Mumbai Office',
      description: 'Mumbai branch office perimeter',
      center: { lat: 19.0760, lng: 72.8777 },
      radius: 300,
      type: 'safe',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      color: '#10B981'
    },
    {
      id: 'gf-005',
      name: 'Bangalore Tech Park',
      description: 'Technology park safe zone',
      center: { lat: 12.9716, lng: 77.5946 },
      radius: 800,
      type: 'safe',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      color: '#10B981'
    }
  ];
}

// Simulate real-time location updates
export function simulateLocationUpdate(
  users: Array<{
    id: string;
    name: string;
    location: { lat: number; lng: number };
    [key: string]: unknown;
  }>,
  geofenceZones: GeofenceZone[]
): UserLocation[] {
  return users.map(user => {
    // Add some random movement to simulate real tracking
    const latOffset = (Math.random() - 0.5) * 0.001; // ~100m random movement
    const lngOffset = (Math.random() - 0.5) * 0.001;
    
    const newLat = user.location.lat + latOffset;
    const newLng = user.location.lng + lngOffset;
    
    const { violations, currentZones } = checkGeofenceViolations(
      {
        userId: user.id,
        userName: user.name,
        lat: newLat,
        lng: newLng,
        timestamp: new Date(),
        isInside: false,
        violatedZones: []
      },
      geofenceZones
    );

    return {
      userId: user.id,
      userName: user.name,
      lat: newLat,
      lng: newLng,
      timestamp: new Date(),
      accuracy: 5 + Math.random() * 10, // 5-15m accuracy
      isInside: currentZones.length > 0,
      violatedZones: currentZones
    };
  });
}