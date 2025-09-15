import React, { useState } from 'react';
import OpenStreetMap from './OpenStreetMap';
import FallbackMap from './FallbackMap';
import styles from '../../styles/geofence.module.css';

// Use local interfaces to match OpenStreetMap and FallbackMap components
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

interface MapComparisonProps {
  geofenceZones: GeofenceZone[];
  userLocations: UserLocation[];
  height?: string;
  width?: string;
}

const MapComparison: React.FC<MapComparisonProps> = ({
  geofenceZones,
  userLocations,
  height = '600px',
  width = '100%'
}) => {
  const [selectedMap, setSelectedMap] = useState<'openstreet' | 'fallback'>('openstreet');

  return (
    <div className={styles.mapComparisonContainer}>
      <div className={styles.mapSelector}>
        <span className={styles.mapSelectorLabel}>Map Type:</span>
        
        <button
          onClick={() => setSelectedMap('openstreet')}
          className={`${styles.mapButton} ${selectedMap === 'openstreet' ? styles.openstreet : styles.openstreetInactive}`}
        >
          🌍 OpenStreetMap (Free)
        </button>
        
        <button
          onClick={() => setSelectedMap('fallback')}
          className={`${styles.mapButton} ${selectedMap === 'fallback' ? styles.fallback : styles.fallbackInactive}`}
        >
          📊 SVG Fallback
        </button>
      </div>

      <div className={styles.mapDescription}>
        {selectedMap === 'openstreet' && (
          <div>
            ✅ <strong>OpenStreetMap:</strong> Interactive map with zoom, pan, and real tiles. No API key required!
          </div>
        )}
        {selectedMap === 'fallback' && (
          <div>
            ✅ <strong>SVG Fallback:</strong> Lightweight, custom visualization that works everywhere.
          </div>
        )}
      </div>

      <div className={styles.mapContainer}>
        {selectedMap === 'openstreet' && (
          <OpenStreetMap
            zones={geofenceZones}
            users={userLocations}
            center={{ lat: 28.6139, lng: 77.2090 }}
            zoom={13}
            height={height}
            width={width}
          />
        )}

        {selectedMap === 'fallback' && (
          <FallbackMap
            zones={geofenceZones}
            users={userLocations}
            center={{ lat: 28.6139, lng: 77.2090 }}
            zoom={13}
            height={height}
            width={width}
          />
        )}
      </div>
    </div>
  );
};

export default MapComparison;