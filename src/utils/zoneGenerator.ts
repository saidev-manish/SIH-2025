import { GeofenceZone, UserLocation } from '../types/geofence';

// Zone templates based on different area types
export const ZONE_TEMPLATES = {
  safe: {
    name: 'Safe Zone',
    type: 'safe' as const,
    color: '#22c55e',
    radius: 2000, // 2km radius
    description: 'Designated safe area for users'
  },
  restricted: {
    name: 'Restricted Area',
    type: 'restricted' as const,
    color: '#ef4444',
    radius: 1500, // 1.5km radius
    description: 'Access restricted - authorization required'
  },
  noDrone: {
    name: 'No Drone Zone',
    type: 'restricted' as const,
    color: '#f59e0b',
    radius: 3000, // 3km radius
    description: 'No drone operations allowed - airspace restricted'
  },
  airport: {
    name: 'Airport Security Zone',
    type: 'restricted' as const,
    color: '#dc2626',
    radius: 5000, // 5km radius
    description: 'Airport vicinity - strict no-fly zone'
  },
  military: {
    name: 'Military Zone',
    type: 'restricted' as const,
    color: '#7c2d12',
    radius: 4000, // 4km radius
    description: 'Military installation - unauthorized access prohibited'
  },
  hospital: {
    name: 'Hospital Quiet Zone',
    type: 'safe' as const,
    color: '#059669',
    radius: 500, // 500m radius
    description: 'Hospital area - maintain quiet environment'
  },
  school: {
    name: 'School Safety Zone',
    type: 'safe' as const,
    color: '#0d9488',
    radius: 800, // 800m radius
    description: 'Educational institution - child safety priority'
  }
};

// Function to generate zones around user locations
export const generateZonesAroundUsers = (
  users: Array<{ id: string; name: string; location: { lat: number; lng: number; address: string } }>,
  zoneType: keyof typeof ZONE_TEMPLATES = 'safe'
): GeofenceZone[] => {
  const template = ZONE_TEMPLATES[zoneType];
  
  return users.map((user, index) => ({
    id: `${zoneType}_${user.id}_${Date.now()}_${index}`,
    name: `${template.name} - ${user.name}`,
    center: {
      lat: user.location.lat,
      lng: user.location.lng
    },
    radius: template.radius,
    type: template.type,
    color: template.color,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: `${template.description} | Location: ${user.location.address}`
  }));
};

// Function to generate zones for specific Indian cities with real-world data
export const generateCityBasedZones = (): GeofenceZone[] => {
  const cityZones = [
    // Delhi - Major areas
    {
      name: 'Red Fort - No Drone Zone',
      lat: 28.6562, lng: 77.2410,
      type: 'restricted' as const,
      radius: 2000,
      description: 'Historical monument - drone operations prohibited'
    },
    {
      name: 'IGI Airport - Restricted Airspace',
      lat: 28.5562, lng: 77.1000,
      type: 'restricted' as const,
      radius: 8000,
      description: 'Airport security zone - no unauthorized aircraft'
    },
    {
      name: 'India Gate - Safe Tourist Zone',
      lat: 28.6129, lng: 77.2295,
      type: 'safe' as const,
      radius: 1500,
      description: 'Tourist area - enhanced safety measures'
    },
    
    // Mumbai - Key locations
    {
      name: 'Gateway of India - Tourist Safe Zone',
      lat: 18.9220, lng: 72.8347,
      type: 'safe' as const,
      radius: 1000,
      description: 'Major tourist attraction - safety priority'
    },
    {
      name: 'Mumbai Airport - No Fly Zone',
      lat: 19.0896, lng: 72.8656,
      type: 'restricted' as const,
      radius: 7000,
      description: 'International airport - restricted airspace'
    },
    
    // Bangalore - Tech hubs
    {
      name: 'Electronic City - Tech Safe Zone',
      lat: 12.8456, lng: 77.6603,
      type: 'safe' as const,
      radius: 3000,
      description: 'Technology hub - enhanced security zone'
    },
    {
      name: 'Bangalore Airport - Restricted Zone',
      lat: 13.1986, lng: 77.7066,
      type: 'restricted' as const,
      radius: 6000,
      description: 'Airport vicinity - no drone operations'
    },
    
    // Chennai - Important areas
    {
      name: 'Marina Beach - Public Safety Zone',
      lat: 13.0475, lng: 80.2824,
      type: 'safe' as const,
      radius: 2000,
      description: 'Popular beach - public safety ensured'
    },
    {
      name: 'Chennai Airport - No Fly Zone',
      lat: 12.9941, lng: 80.1709,
      type: 'restricted' as const,
      radius: 5500,
      description: 'Airport security perimeter'
    },
    
    // Kolkata - Cultural sites
    {
      name: 'Victoria Memorial - Heritage Zone',
      lat: 22.5448, lng: 88.3426,
      type: 'safe' as const,
      radius: 1200,
      description: 'Heritage monument - protected area'
    },
    {
      name: 'Kolkata Airport - Restricted Airspace',
      lat: 22.6540, lng: 88.4469,
      type: 'restricted' as const,
      radius: 4500,
      description: 'Airport security zone'
    }
  ];

  return cityZones.map((zone, index) => ({
    id: `city_zone_${index}_${Date.now()}`,
    name: zone.name,
    center: { lat: zone.lat, lng: zone.lng },
    radius: zone.radius,
    type: zone.type,
    color: zone.type === 'safe' ? '#22c55e' : zone.type === 'restricted' ? '#ef4444' : '#f59e0b',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: zone.description
  }));
};

// Function to detect nearby restricted areas based on coordinates
export const detectNearbyRestrictedAreas = (lat: number, lng: number): string[] => {
  const restrictions: string[] = [];
  
  // Airport proximity check (simplified)
  const airports = [
    { name: 'IGI Delhi', lat: 28.5562, lng: 77.1000, radius: 8000 },
    { name: 'Mumbai Airport', lat: 19.0896, lng: 72.8656, radius: 7000 },
    { name: 'Bangalore Airport', lat: 13.1986, lng: 77.7066, radius: 6000 },
    { name: 'Chennai Airport', lat: 12.9941, lng: 80.1709, radius: 5500 },
    { name: 'Kolkata Airport', lat: 22.6540, lng: 88.4469, radius: 4500 }
  ];
  
  airports.forEach(airport => {
    const distance = calculateDistance(lat, lng, airport.lat, airport.lng);
    if (distance <= airport.radius) {
      restrictions.push(`Near ${airport.name} - No Drone Zone (${Math.round(distance)}m away)`);
    }
  });
  
  // Government building proximity
  const govBuildings = [
    { name: 'Parliament House Delhi', lat: 28.6168, lng: 77.2090 },
    { name: 'Rashtrapati Bhavan', lat: 28.6144, lng: 77.1989 },
    { name: 'Supreme Court', lat: 28.6239, lng: 77.2387 }
  ];
  
  govBuildings.forEach(building => {
    const distance = calculateDistance(lat, lng, building.lat, building.lng);
    if (distance <= 3000) { // 3km restriction around government buildings
      restrictions.push(`Near ${building.name} - Restricted Zone (${Math.round(distance)}m away)`);
    }
  });
  
  return restrictions;
};

// Helper function to calculate distance between two coordinates
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Function to create smart zones based on user clustering
export const createSmartZones = (
  users: Array<{ id: string; name: string; location: { lat: number; lng: number; address: string } }>
): GeofenceZone[] => {
  const zones: GeofenceZone[] = [];
  
  // Group users by proximity (within 5km)
  const clusters: Array<typeof users> = [];
  const processed = new Set<string>();
  
  users.forEach(user => {
    if (processed.has(user.id)) return;
    
    const cluster = [user];
    processed.add(user.id);
    
    users.forEach(otherUser => {
      if (processed.has(otherUser.id)) return;
      
      const distance = calculateDistance(
        user.location.lat, user.location.lng,
        otherUser.location.lat, otherUser.location.lng
      );
      
      if (distance <= 5000) { // 5km clustering
        cluster.push(otherUser);
        processed.add(otherUser.id);
      }
    });
    
    clusters.push(cluster);
  });
  
  // Create zones for each cluster
  clusters.forEach((cluster, index) => {
    if (cluster.length === 1) {
      // Single user - create individual zone
      const user = cluster[0];
      zones.push({
        id: `smart_individual_${user.id}_${Date.now()}`,
        name: `Individual Safe Zone - ${user.name}`,
        center: user.location,
        radius: 1000,
        type: 'safe',
        color: '#22c55e',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: `Personal safety zone for ${user.name} in ${user.location.address}`
      });
    } else {
      // Multiple users - create cluster zone
      const centerLat = cluster.reduce((sum, u) => sum + u.location.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, u) => sum + u.location.lng, 0) / cluster.length;
      
      zones.push({
        id: `smart_cluster_${index}_${Date.now()}`,
        name: `Community Safe Zone - ${cluster.length} Users`,
        center: { lat: centerLat, lng: centerLng },
        radius: 3000,
        type: 'safe',
        color: '#059669',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: `Community safety zone covering ${cluster.map(u => u.name).join(', ')}`
      });
    }
  });
  
  return zones;
};