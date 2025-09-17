import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/geofence.module.css';

// Local interfaces to match GeofenceManager
interface GeofenceZone {
  id: string;
  name: string;
  description: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number;
  type: 'safe' | 'restricted' | 'warning';
}

interface UserLocation {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  lastUpdate: Date;
  inZone?: string;
  email?: string;
}

interface OpenStreetMapProps {
  geofenceZones: GeofenceZone[];
  userLocations: UserLocation[];
  center: [number, number];
  zoom: number;
  onZoneCreate: (zone: Omit<GeofenceZone, 'id'>) => void;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  geofenceZones,
  userLocations,
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
        const L = leaflet.default;
        
        // Import CSS
        await import('leaflet/dist/leaflet.css');
        
        // Fix default marker icons for Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setL(L);
        
        // Initialize map
        const mapInstance = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        setMap(mapInstance);
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
  }, [isClient]);

  useEffect(() => {
    if (!map || !L) return;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Circle || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add geofence zones
    geofenceZones.forEach(zone => {
      const circle = L.circle([zone.center.lat, zone.center.lng], {
        color: zone.type === 'safe' ? '#28a745' : zone.type === 'warning' ? '#ffc107' : '#dc3545',
        fillColor: zone.type === 'safe' ? '#28a745' : zone.type === 'warning' ? '#ffc107' : '#dc3545',
        fillOpacity: 0.2,
        radius: zone.radius
      }).addTo(map);

      circle.bindPopup(`
        <div>
          <h4>${zone.name}</h4>
          <p><strong>Type:</strong> ${zone.type}</p>
          <p><strong>Description:</strong> ${zone.description}</p>
          <p><strong>Radius:</strong> ${zone.radius}m</p>
        </div>
      `);
    });

    // Add user locations
    userLocations.forEach(user => {
      const icon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            background: ${user.inZone ? '#dc3545' : '#007bff'};
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            ${user.name.charAt(0).toUpperCase()}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([user.position.lat, user.position.lng], { icon }).addTo(map);
      
      marker.bindPopup(`
        <div>
          <h4>${user.name}</h4>
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
          <p><strong>Status:</strong> ${user.inZone ? `In ${user.inZone} zone` : 'Safe area'}</p>
          <p><strong>Last Update:</strong> ${user.lastUpdate.toLocaleString()}</p>
          <p><strong>Coordinates:</strong> ${user.position.lat.toFixed(6)}, ${user.position.lng.toFixed(6)}</p>
        </div>
      `);
    });
  }, [map, L, geofenceZones, userLocations]);

  if (!isClient) {
    return (
      <div className={styles.mapContainer} style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading map...</div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
      <div className={styles.mapInfo}>
        <h4>🗺️ OpenStreetMap View</h4>
        <p>Interactive map showing geofence zones and user locations</p>
        <div className={styles.mapLegend}>
          <div><span style={{ color: '#28a745' }}>●</span> Safe Zones</div>
          <div><span style={{ color: '#ffc107' }}>●</span> Warning Zones</div>
          <div><span style={{ color: '#dc3545' }}>●</span> Restricted Zones</div>
        </div>
      </div>
    </div>
  );
};

export default OpenStreetMap;