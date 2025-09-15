import React from 'react';
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

interface FallbackMapProps {
  zones: GeofenceZone[];
  users: UserLocation[];
  center: { lat: number; lng: number };
  zoom: number;
  onZoneCreate?: (zoneData: Partial<GeofenceZone>) => void;
  height?: string;
  width?: string;
}

const FallbackMap: React.FC<FallbackMapProps> = ({
  zones,
  users,
  center,
  zoom,
  onZoneCreate,
  height = '600px',
  width = '100%'
}) => {
  // Calculate bounds to center the view
  const getBounds = () => {
    if (zones.length === 0 && users.length === 0) {
      return {
        center: { lat: 28.6139, lng: 77.2090 }, // Delhi default
        zoom: 12
      };
    }

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    zones.forEach(zone => {
      minLat = Math.min(minLat, zone.center.lat);
      maxLat = Math.max(maxLat, zone.center.lat);
      minLng = Math.min(minLng, zone.center.lng);
      maxLng = Math.max(maxLng, zone.center.lng);
    });

    users.forEach(user => {
      minLat = Math.min(minLat, user.position.lat);
      maxLat = Math.max(maxLat, user.position.lat);
      minLng = Math.min(minLng, user.position.lng);
      maxLng = Math.max(maxLng, user.position.lng);
    });

    return {
      center: {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      },
      bounds: { minLat, maxLat, minLng, maxLng }
    };
  };

  const { center: mapCenter, bounds } = getBounds();

  // Convert lat/lng to pixel coordinates for visualization
  const coordToPixel = (lat: number, lng: number, containerWidth: number, containerHeight: number) => {
    if (!bounds) {
      return { x: containerWidth / 2, y: containerHeight / 2 };
    }

    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;

    const x = ((lng - bounds.minLng) / lngRange) * containerWidth;
    const y = containerHeight - ((lat - bounds.minLat) / latRange) * containerHeight;

    return { x, y };
  };

  return (
    <div className={styles.fallbackMapContainer}>
      <div className={styles.mapHeader}>
        <h4>🗺️ Geofence Visualization Map</h4>
        <p>Interactive map showing geofence zones and user locations</p>
      </div>
      
      <div className={styles.mapCanvas}>
        <svg width="100%" height={height} viewBox="0 0 800 600" className={styles.mapSvg}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Center coordinates indicator */}
          <text x="10" y="20" className={styles.mapLabel}>
            Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </text>
          
          {/* Geofence zones */}
          {zones.map(zone => {
            if (!zone.isActive) return null;
            
            const { x, y } = coordToPixel(zone.center.lat, zone.center.lng, 800, 600);
            const radiusPixels = Math.max(20, Math.min(100, zone.radius / 10)); // Scale radius for visualization
            
            return (
              <g key={zone.id}>
                {/* Zone circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={radiusPixels}
                  fill={zone.color || '#10B981'}
                  fillOpacity={zone.type === 'restricted' ? 0.3 : 0.15}
                  stroke={zone.color || '#10B981'}
                  strokeWidth="2"
                  className={styles.zoneCircle}
                />
                
                {/* Zone center marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={zone.color || '#10B981'}
                  className={styles.zoneCenterMarker}
                />
                
                {/* Zone label */}
                <text
                  x={x}
                  y={y - radiusPixels - 10}
                  className={styles.zoneLabel}
                  textAnchor="middle"
                >
                  {zone.name}
                </text>
                
                {/* Zone type indicator */}
                <text
                  x={x}
                  y={y + radiusPixels + 15}
                  className={`${styles.zoneTypeLabel} ${styles[zone.type]}`}
                  textAnchor="middle"
                >
                  {zone.type.toUpperCase()}
                </text>
              </g>
            );
          })}
          
          {/* User locations */}
          {users.map(user => {
            const { x, y } = coordToPixel(user.position.lat, user.position.lng, 800, 600);
            const isInViolation = user.status === 'danger';
            
            return (
              <g key={user.id}>
                {/* User marker background */}
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill={isInViolation ? '#FEE2E2' : '#DCFCE7'}
                  stroke={isInViolation ? '#EF4444' : '#10B981'}
                  strokeWidth="2"
                  className={styles.userMarker}
                />
                
                {/* User marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={isInViolation ? '#EF4444' : '#10B981'}
                  stroke="white"
                  strokeWidth="2"
                />
                
                {/* User initial */}
                <text
                  x={x}
                  y={y + 3}
                  className={styles.userInitial}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {user.name.charAt(0).toUpperCase()}
                </text>
                
                {/* User label with background */}
                <rect
                  x={x - 25}
                  y={y - 25}
                  width="50"
                  height="12"
                  fill="rgba(0, 0, 0, 0.7)"
                  rx="6"
                />
                <text
                  x={x}
                  y={y - 17}
                  className={styles.userLabel}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {user.name}
                </text>
                
                {/* Violation indicator */}
                {isInViolation && (
                  <text
                    x={x + 15}
                    y={y - 5}
                    className={styles.violationIndicator}
                    fontSize="14"
                  >
                    ⚠️
                  </text>
                )}
              </g>
            );
          })}
          
          {/* No data message */}
          {zones.length === 0 && users.length === 0 && (
            <text
              x="400"
              y="300"
              className={styles.noDataMessage}
              textAnchor="middle"
            >
              No geofence zones or users to display
            </text>
          )}
        </svg>
      </div>
      
      {/* Map statistics */}
      <div className={styles.mapStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Active Zones:</span>
          <span className={styles.statValue}>{zones.filter(z => z.isActive).length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Users Tracked:</span>
          <span className={styles.statValue}>{users.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Violations:</span>
          <span className={styles.statValue}>
            {users.filter(u => u.status === 'danger').length}
          </span>
        </div>
      </div>
      
      {/* Map legend */}
      <div className={styles.mapLegend}>
        <h5>Map Legend</h5>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <div className={styles.legendIcon} data-type="safe"></div>
            <span>Safe Zone</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendIcon} data-type="warning"></div>
            <span>Warning Zone</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendIcon} data-type="restricted"></div>
            <span>Restricted Zone</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendIcon} data-type="user-safe"></div>
            <span>User (Safe)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendIcon} data-type="user-violation"></div>
            <span>User (Violation)</span>
          </div>
        </div>
      </div>
      
      {/* Google Maps setup instructions */}
      <div className={styles.mapInstructions}>
        <h5>🔧 To Enable Google Maps:</h5>
        <ol>
          <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
          <li>Enable Maps JavaScript API and Geometry API</li>
          <li>Replace &apos;YOUR_GOOGLE_MAPS_API_KEY&apos; in GeofenceMap.tsx with your actual API key</li>
          <li>The interactive Google Maps will then load automatically</li>
        </ol>
      </div>
    </div>
  );
};

export default FallbackMap;