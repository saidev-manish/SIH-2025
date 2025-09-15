// Location Service for Security Zones and Critical Infrastructure
export interface SecurityZone {
  id: string;
  name: string;
  type: 'police_station' | 'military_base' | 'no_fly_zone' | 'restricted_area' | 'security_perimeter';
  coordinates: {
    lat: number;
    lng: number;
  };
  radius?: number; // in meters
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  contact?: string;
  restrictions: string[];
}

export interface UserLocation {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  lastUpdated: Date;
}

// Mock security zones data for India (focusing on NCR region)
export const securityZones: SecurityZone[] = [
  // Police Stations in Delhi/NCR
  {
    id: 'ps_connaught_place',
    name: 'Connaught Place Police Station',
    type: 'police_station',
    coordinates: { lat: 28.6315, lng: 77.2167 },
    radius: 500,
    severity: 'medium',
    description: 'Main police station covering central Delhi area',
    contact: '+91-11-23344556',
    restrictions: ['24/7 Emergency Response', 'Tourist Police Available']
  },
  {
    id: 'ps_karol_bagh',
    name: 'Karol Bagh Police Station',
    type: 'police_station',
    coordinates: { lat: 28.6519, lng: 77.1909 },
    radius: 500,
    severity: 'medium',
    description: 'Police station in Karol Bagh area',
    contact: '+91-11-25753020',
    restrictions: ['Commercial Area Coverage', 'Traffic Management']
  },
  {
    id: 'ps_india_gate',
    name: 'India Gate Police Station',
    type: 'police_station',
    coordinates: { lat: 28.6129, lng: 77.2295 },
    radius: 500,
    severity: 'medium',
    description: 'Police station near India Gate',
    contact: '+91-11-23386512',
    restrictions: ['Tourist Area Security', 'VIP Movement Coordination']
  },
  
  // Military/Army Restricted Areas
  {
    id: 'mil_red_fort',
    name: 'Red Fort Security Zone',
    type: 'military_base',
    coordinates: { lat: 28.6562, lng: 77.2410 },
    radius: 1000,
    severity: 'high',
    description: 'High security zone around Red Fort - UNESCO World Heritage Site',
    contact: 'Delhi Police Control Room',
    restrictions: ['No Photography in Restricted Areas', 'Security Checkpoints', 'Bag Screening Required']
  },
  {
    id: 'mil_rashtrapati_bhawan',
    name: 'Rashtrapati Bhawan Security Perimeter',
    type: 'security_perimeter',
    coordinates: { lat: 28.6142, lng: 77.1910 },
    radius: 2000,
    severity: 'critical',
    description: 'Presidential Palace security zone with multiple checkpoints',
    contact: 'President Secretariat Security',
    restrictions: ['Vehicular Movement Restricted', 'Multiple Security Layers', 'Armed Personnel Present']
  },
  {
    id: 'mil_parliament',
    name: 'Parliament House Security Zone',
    type: 'security_perimeter',
    coordinates: { lat: 28.6170, lng: 77.2090 },
    radius: 1500,
    severity: 'critical',
    description: 'Parliament complex with high security measures',
    contact: 'Parliament Security Office',
    restrictions: ['No Unauthorized Entry', 'Security Clearance Required', 'Metal Detectors']
  },

  // No-Fly Zones
  {
    id: 'nfz_indira_gandhi_airport',
    name: 'IGI Airport No-Fly Zone',
    type: 'no_fly_zone',
    coordinates: { lat: 28.5562, lng: 77.1000 },
    radius: 5000,
    severity: 'critical',
    description: 'Restricted airspace around Indira Gandhi International Airport',
    contact: 'Airport Authority of India',
    restrictions: ['No Drone Operations', 'Aircraft Landing/Takeoff Zone', 'Radar Monitored']
  },
  {
    id: 'nfz_central_delhi',
    name: 'Central Delhi No-Fly Zone',
    type: 'no_fly_zone',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    radius: 3000,
    severity: 'high',
    description: 'Government area with drone flight restrictions',
    contact: 'Civil Aviation Authority',
    restrictions: ['No Unauthorized Aerial Vehicles', 'Government VIP Areas', 'Security Enforcement']
  },
  {
    id: 'nfz_military_cantt',
    name: 'Delhi Cantonment No-Fly Zone',
    type: 'no_fly_zone',
    coordinates: { lat: 28.5672, lng: 77.1475 },
    radius: 2500,
    severity: 'critical',
    description: 'Military cantonment area with strict aerial restrictions',
    contact: 'Delhi Cantonment Board',
    restrictions: ['Military Airspace', 'Defense Installation Protection', 'Immediate Enforcement']
  },

  // Additional Restricted Areas
  {
    id: 'rest_supreme_court',
    name: 'Supreme Court Security Zone',
    type: 'restricted_area',
    coordinates: { lat: 28.6240, lng: 77.2382 },
    radius: 800,
    severity: 'high',
    description: 'Judiciary complex with enhanced security',
    contact: 'Supreme Court Security',
    restrictions: ['Visitor Registration Required', 'Security Screening', 'Restricted Parking']
  },
  {
    id: 'rest_north_block',
    name: 'North Block Government Complex',
    type: 'restricted_area',
    coordinates: { lat: 28.6119, lng: 77.2068 },
    radius: 600,
    severity: 'high',
    description: 'Government secretariat with access control',
    contact: 'Central Secretariat Security',
    restrictions: ['Government ID Required', 'Prior Appointment Needed', 'Vehicle Screening']
  }
];

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Find nearest security zones to a user location
export function findNearbySecurityZones(
  userLat: number, 
  userLng: number, 
  maxDistance: number = 10 // km
): (SecurityZone & { distance: number })[] {
  return securityZones
    .map(zone => ({
      ...zone,
      distance: calculateDistance(userLat, userLng, zone.coordinates.lat, zone.coordinates.lng)
    }))
    .filter(zone => zone.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

// Find nearest police stations specifically
export function findNearestPoliceStations(
  userLat: number, 
  userLng: number, 
  limit: number = 3
): (SecurityZone & { distance: number })[] {
  return securityZones
    .filter(zone => zone.type === 'police_station')
    .map(zone => ({
      ...zone,
      distance: calculateDistance(userLat, userLng, zone.coordinates.lat, zone.coordinates.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

// Check if user is in any restricted zones
export function checkUserInRestrictedZones(
  userLat: number, 
  userLng: number
): SecurityZone[] {
  return securityZones.filter(zone => {
    const distance = calculateDistance(userLat, userLng, zone.coordinates.lat, zone.coordinates.lng);
    const zoneRadiusKm = (zone.radius || 500) / 1000; // Convert meters to km
    return distance <= zoneRadiusKm;
  });
}

// Generate security alerts based on user location
export function generateSecurityAlerts(
  userLat: number, 
  userLng: number
): {
  level: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  zones: SecurityZone[];
}[] {
  const alerts = [];
  const nearbyZones = findNearbySecurityZones(userLat, userLng, 2); // Within 2km
  const restrictedZones = checkUserInRestrictedZones(userLat, userLng);

  // Critical alerts for being inside restricted zones
  if (restrictedZones.length > 0) {
    const criticalZones = restrictedZones.filter(z => z.severity === 'critical');
    const highZones = restrictedZones.filter(z => z.severity === 'high');

    if (criticalZones.length > 0) {
      alerts.push({
        level: 'critical' as const,
        message: `CRITICAL: You are in a high-security zone. Immediate compliance with security protocols required.`,
        zones: criticalZones
      });
    }

    if (highZones.length > 0) {
      alerts.push({
        level: 'danger' as const,
        message: `WARNING: You are in a restricted area. Please follow security guidelines.`,
        zones: highZones
      });
    }
  }

  // No-fly zone alerts
  const noFlyZones = nearbyZones.filter(z => z.type === 'no_fly_zone' && z.distance <= 1);
  if (noFlyZones.length > 0) {
    alerts.push({
      level: 'warning' as const,
      message: `DRONE ALERT: You are near a no-fly zone. Drone operations are prohibited.`,
      zones: noFlyZones
    });
  }

  // Informational alerts for nearby police stations
  const nearbyPolice = nearbyZones.filter(z => z.type === 'police_station' && z.distance <= 0.5);
  if (nearbyPolice.length > 0) {
    alerts.push({
      level: 'info' as const,
      message: `Police assistance available nearby. Emergency contact: 100`,
      zones: nearbyPolice
    });
  }

  return alerts;
}

// Get zone color based on type and severity
export function getZoneColor(zone: SecurityZone): string {
  switch (zone.type) {
    case 'police_station':
      return '#3B82F6'; // Blue
    case 'military_base':
      return '#DC2626'; // Red
    case 'no_fly_zone':
      return '#F59E0B'; // Orange
    case 'restricted_area':
      return '#EF4444'; // Red-Orange
    case 'security_perimeter':
      return '#7C2D12'; // Dark Red
    default:
      return '#6B7280'; // Gray
  }
}

// Get zone icon based on type
export function getZoneIcon(zone: SecurityZone): string {
  switch (zone.type) {
    case 'police_station':
      return '🚔';
    case 'military_base':
      return '🏛️';
    case 'no_fly_zone':
      return '🚁';
    case 'restricted_area':
      return '⛔';
    case 'security_perimeter':
      return '🛡️';
    default:
      return '📍';
  }
}