/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/geofence.module.css';

// Local interfaces to match GeofenceManager
interface GeofenceZone {
  id: string;
  name: string;
  description: string;
  center: { lat: number; lng: number };
  radius: number;
  type: 'safe' | 'restricted' | 'warning';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  color: string;
}

interface UserLocation {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  status: 'safe' | 'warning' | 'danger';
  lastUpdate: Date;
  inZone?: string;
  email?: string;
}

interface OpenStreetMapProps {
  zones: GeofenceZone[];
  users: UserLocation[];
  center: { lat: number; lng: number };
  zoom: number;
  onZoneCreate?: (zoneData: Partial<GeofenceZone>) => void;
  height?: string;
  width?: string;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  zones,
  users,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Dynamic import of leaflet to avoid SSR issues
    const loadLeaflet = async () => {
      try {
        const leaflet = await import('leaflet');
        const LeafletLib = leaflet.default;
        
        // Fix default marker icons for Leaflet
        delete (LeafletLib.Icon.Default.prototype as any)._getIconUrl;
        LeafletLib.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setL(LeafletLib as any);
        
        // Initialize map
        if (mapRef.current) {
          const mapInstance = LeafletLib.map(mapRef.current).setView([20.5937, 78.9629], 5);
          
          // Add OpenStreetMap tiles
          LeafletLib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(mapInstance);

          setMap(mapInstance);
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [isClient, map]);

  useEffect(() => {
    if (!map || !L) return;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Circle || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Helper function to calculate distance between two points
    const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

    // Add geofence zones
    zones.forEach((zone) => {
      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radius,
        color: zone.type === 'safe' ? '#22c55e' : zone.type === 'warning' ? '#fbbf24' : '#ef4444',
        fillColor: zone.type === 'safe' ? '#22c55e' : zone.type === 'warning' ? '#fbbf24' : '#ef4444',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);

      // Add popup with zone info
      circle.bindPopup(`
        <div>
          <h3>${zone.name}</h3>
          <p><strong>Type:</strong> ${zone.type}</p>
          <p><strong>Status:</strong> ${zone.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Radius:</strong> ${zone.radius}m</p>
        </div>
      `);
    });

    // Add user locations
    users.forEach((user) => {
      // Determine marker color based on user location relative to zones
      const isInSafeZone = zones.some(zone => 
        zone.type === 'safe' && zone.isActive &&
        getDistance(user.position.lat, user.position.lng, zone.center.lat, zone.center.lng) <= zone.radius
      );
      const isInDangerZone = zones.some(zone => 
        zone.type === 'restricted' && zone.isActive &&
        getDistance(user.position.lat, user.position.lng, zone.center.lat, zone.center.lng) <= zone.radius
      );
      
      const markerColor = isInDangerZone ? '#ef4444' : 
                         isInSafeZone ? '#22c55e' : '#3b82f6';
      
      // Create custom icon based on status
      const icon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            background: ${markerColor};
            color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${user.name.charAt(0).toUpperCase()}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([user.position.lat, user.position.lng], { icon }).addTo(map);

      // Add popup with user info
      const status = isInDangerZone ? '🚨 In Danger Zone' : 
                    isInSafeZone ? '✅ In Safe Zone' : '⚪ Outside Zones';
      
      marker.bindPopup(`
        <div style="font-family: 'Segoe UI', sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${user.name}</h3>
          <p style="margin: 2px 0; font-weight: bold; color: ${isInDangerZone ? '#ef4444' : isInSafeZone ? '#10b981' : '#6b7280'};">
            <strong>Status:</strong> ${status}
          </p>
          <p style="margin: 2px 0; color: #64748b;">
            <strong>Last Update:</strong> ${user.lastUpdate.toLocaleString()}
          </p>
          <p style="margin: 2px 0; color: #64748b;">
            <strong>Location:</strong> ${user.position.lat.toFixed(6)}, ${user.position.lng.toFixed(6)}
          </p>
          ${user.email ? `<p style="margin: 2px 0; color: #64748b;"><strong>Email:</strong> ${user.email}</p>` : ''}
          ${user.inZone ? `<p style="margin: 4px 0; color: #2563eb; font-weight: bold;">🔹 In Zone: ${user.inZone}</p>` : ''}
        </div>
      `);
    });

    // Auto-fit bounds if there are zones or users
    const allPoints: [number, number][] = [
      ...zones.map(zone => [zone.center.lat, zone.center.lng] as [number, number]),
      ...users.map(user => [user.position.lat, user.position.lng] as [number, number])
    ];

    if (allPoints.length > 0) {
      const group = new L.FeatureGroup();
      allPoints.forEach(point => {
        L.marker(point).addTo(group);
      });
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [map, L, zones, users]);

  if (!isClient) {
    return (
      <div className={styles.mapLoading}>
        <div>Loading map...</div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div 
        ref={mapRef} 
        className={styles.mapContent}
      />
      <div className={styles.mapBadge}>
        🌍 OpenStreetMap (Free)
      </div>
    </div>
  );
};

export default OpenStreetMap;