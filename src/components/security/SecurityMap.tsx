import React, { useState, useEffect } from 'react';
import { 
  securityZones, 
  findNearbySecurityZones, 
  findNearestPoliceStations,
  generateSecurityAlerts,
  getZoneColor,
  getZoneIcon,
  SecurityZone
} from '../../services/locationService';
import styles from '../../styles/securityMap.module.css';

interface SecurityMapProps {
  userLocation: {
    id: string;
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  showControls?: boolean;
}

const SecurityMap: React.FC<SecurityMapProps> = ({ userLocation, showControls = true }) => {
  const [activeFilters, setActiveFilters] = useState({
    police_station: true,
    military_base: true,
    no_fly_zone: true,
    restricted_area: true,
    security_perimeter: true
  });
  const [selectedZone, setSelectedZone] = useState<SecurityZone | null>(null);
  const [radarMode, setRadarMode] = useState(false);
  const [alerts, setAlerts] = useState<Array<{
    level: 'info' | 'warning' | 'danger' | 'critical';
    message: string;
    zones: SecurityZone[];
  }>>([]);

  const nearbyZones = findNearbySecurityZones(
    userLocation.coordinates.lat, 
    userLocation.coordinates.lng, 
    10
  );

  const nearestPolice = findNearestPoliceStations(
    userLocation.coordinates.lat, 
    userLocation.coordinates.lng, 
    3
  );

  useEffect(() => {
    const securityAlerts = generateSecurityAlerts(
      userLocation.coordinates.lat,
      userLocation.coordinates.lng
    );
    setAlerts(securityAlerts);
  }, [userLocation]);

  const filteredZones = nearbyZones.filter(zone => activeFilters[zone.type]);

  // Position radar blips using JavaScript to avoid inline styles
  useEffect(() => {
    if (!radarMode) return;
    
    const blips = document.querySelectorAll('[data-bearing]');
    blips.forEach((blip: Element) => {
      const bearing = parseFloat(blip.getAttribute('data-bearing') || '0');
      const distance = parseFloat(blip.getAttribute('data-distance') || '0');
      
      // Convert bearing to radians and calculate position
      const angle = (bearing - 90) * Math.PI / 180; // -90 to make 0° point north
      const x = 50 + distance * Math.cos(angle);
      const y = 50 + distance * Math.sin(angle);
      
      (blip as HTMLElement).style.left = `${x}%`;
      (blip as HTMLElement).style.top = `${y}%`;
    });
  }, [radarMode, filteredZones, userLocation]);

  const toggleFilter = (type: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  return (
    <div className={styles.securityMapContainer}>
      {/* Security Alerts Panel */}
      {alerts.length > 0 && (
        <div className={styles.alertsPanel}>
          <h3>🚨 Security Alerts</h3>
          {alerts.map((alert, index) => (
            <div key={index} className={`${styles.alert} ${styles[alert.level]}`}>
              <div className={styles.alertMessage}>{alert.message}</div>
              <div className={styles.alertZones}>
                {alert.zones.map((zone: SecurityZone) => (
                  <span key={zone.id} className={styles.zoneTag}>
                    {getZoneIcon(zone)} {zone.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className={styles.mapControls}>
          <div className={styles.controlGroup}>
            <h4>🗺️ Map Layers</h4>
            <div className={styles.filterButtons}>
              {Object.entries(activeFilters).map(([type, active]) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type as keyof typeof activeFilters)}
                  className={`${styles.filterBtn} ${active ? styles.active : ''}`}
                >
                  {getZoneIcon({ type } as SecurityZone)} {type.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <h4>📡 Display Mode</h4>
            <button
              onClick={() => setRadarMode(!radarMode)}
              className={`${styles.radarBtn} ${radarMode ? styles.active : ''}`}
            >
              {radarMode ? '📡 Radar View' : '🗺️ Map View'}
            </button>
          </div>
        </div>
      )}

      {/* Main Map Display */}
      <div className={`${styles.mapDisplay} ${radarMode ? styles.radarMode : ''}`}>
        {radarMode ? (
          // Enhanced Radar View with Real Positioning
          <div className={styles.radarDisplay}>
            <div className={styles.radarContainer}>
              {/* Map Background */}
              <div className={styles.radarMapBackground}>
                <div className={styles.mapOverlay}></div>
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${userLocation.coordinates.lat},${userLocation.coordinates.lng}&zoom=12&size=500x500&maptype=satellite&key=demo`}
                  alt="Radar Map Background"
                  className={styles.mapImage}
                  onError={(e) => {
                    // Fallback to a simple grid pattern
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(6, 95, 70, 0.1) 100%), linear-gradient(90deg, rgba(255,255,255,0.05) 50%, transparent 50%), linear-gradient(rgba(255,255,255,0.05) 50%, transparent 50%)';
                    target.parentElement!.style.backgroundSize = '100% 100%, 50px 50px, 50px 50px';
                  }}
                />
              </div>
              
              {/* Radar Grid */}
              <div className={styles.radarGrid}>
                {/* Radar Circles with Distance Labels */}
                <div className={`${styles.radarCircle} ${styles.circle20}`}>
                  <span className={styles.distanceLabel}>2km</span>
                </div>
                <div className={`${styles.radarCircle} ${styles.circle40}`}>
                  <span className={styles.distanceLabel}>4km</span>
                </div>
                <div className={`${styles.radarCircle} ${styles.circle60}`}>
                  <span className={styles.distanceLabel}>6km</span>
                </div>
                <div className={`${styles.radarCircle} ${styles.circle80}`}>
                  <span className={styles.distanceLabel}>8km</span>
                </div>

                {/* Zone Markers with Real Positioning */}
                {filteredZones.map((zone) => {
                  // Calculate real bearing from user to zone using proper coordinates
                  const lat1 = userLocation.coordinates.lat * Math.PI / 180;
                  const lat2 = zone.coordinates.lat * Math.PI / 180;
                  const deltaLng = (zone.coordinates.lng - userLocation.coordinates.lng) * Math.PI / 180;
                  
                  const y = Math.sin(deltaLng) * Math.cos(lat2);
                  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
                  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
                  
                  // Scale distance to radar (max 10km = 90% radius)
                  const distance = zone.distance || 0;
                  const radarDistance = Math.min((distance / 10) * 90, 90);
                  
                  return (
                    <div
                      key={zone.id}
                      className={`${styles.radarBlip} ${styles[zone.severity]}`}
                      data-bearing={bearing.toFixed(0)}
                      data-distance={radarDistance.toFixed(0)}
                      onClick={() => setSelectedZone(zone)}
                      title={`${zone.name} - ${distance.toFixed(1)}km ${bearing.toFixed(0)}°`}
                    >
                      <div className={`${styles.blipIcon} ${styles[zone.type]}`}>
                        {getZoneIcon(zone)}
                      </div>
                      <div className={styles.blipLabel}>
                        {zone.name.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}

                {/* User Center Point */}
                <div className={styles.radarCenter}>
                  <div className={styles.userMarker}>
                    <div className={styles.userDot}></div>
                    <div className={styles.userLabel}>{userLocation.name}</div>
                  </div>
                </div>

                {/* Radar Sweep Animation */}
                <div className={styles.radarSweep}></div>
                
                {/* Compass Directions */}
                <div className={styles.compassN}>N</div>
                <div className={styles.compassE}>E</div>
                <div className={styles.compassS}>S</div>
                <div className={styles.compassW}>W</div>
              </div>
            </div>
            
            {/* Radar Info Panel */}
            <div className={styles.radarInfo}>
              <div className={styles.radarStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Zones Detected:</span>
                  <span className={styles.statValue}>{filteredZones.length}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Range:</span>
                  <span className={styles.statValue}>10km radius</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Coordinates:</span>
                  <span className={styles.statValue}>
                    {userLocation.coordinates.lat.toFixed(4)}°, {userLocation.coordinates.lng.toFixed(4)}°
                  </span>
                </div>
              </div>
              
              <div className={styles.radarLegend}>
                <h4>Zone Types:</h4>
                <div className={styles.legendItems}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.critical}`}></div>
                    <span>Critical/Military</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.restricted}`}></div>
                    <span>Restricted</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.police}`}></div>
                    <span>Police/Security</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.nofly}`}></div>
                    <span>No-Fly Zone</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Traditional Map View
          <div className={styles.traditionalMap}>
            <div className={styles.mapHeader}>
              <h3>📍 Security Zones Near {userLocation.name}</h3>
              <div className={styles.coordinates}>
                📌 {userLocation.coordinates.lat.toFixed(6)}, {userLocation.coordinates.lng.toFixed(6)}
              </div>
            </div>

            <div className={styles.mapContent}>
              {/* User Location */}
              <div className={styles.userLocationCard}>
                <div className={styles.userInfo}>
                  <h4>👤 {userLocation.name}</h4>
                  <p>Current Location</p>
                  <div className={styles.coordinates}>
                    Lat: {userLocation.coordinates.lat.toFixed(6)}<br/>
                    Lng: {userLocation.coordinates.lng.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Nearest Police Stations */}
              <div className={styles.policeSection}>
                <h4>🚔 Nearest Police Stations</h4>
                <div className={styles.policeList}>
                  {nearestPolice.map(station => (
                    <div key={station.id} className={styles.policeCard}>
                      <div className={styles.stationInfo}>
                        <strong>{station.name}</strong>
                        <div className={styles.distance}>{formatDistance(station.distance)} away</div>
                        <div className={styles.contact}>📞 {station.contact}</div>
                      </div>
                      <button 
                        className={styles.directionsBtn}
                        onClick={() => window.open(`https://www.google.com/maps/dir/${userLocation.coordinates.lat},${userLocation.coordinates.lng}/${station.coordinates.lat},${station.coordinates.lng}`, '_blank')}
                      >
                        🧭 Directions
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Security Zones */}
              <div className={styles.zonesSection}>
                <h4>🛡️ Security Zones ({filteredZones.length})</h4>
                <div className={styles.zonesList}>
                  {filteredZones.map(zone => (
                    <div 
                      key={zone.id} 
                      className={`${styles.zoneCard} ${styles[zone.severity]}`}
                      onClick={() => setSelectedZone(zone)}
                    >
                      <div className={styles.zoneHeader}>
                        <span className={styles.zoneIcon}>{getZoneIcon(zone)}</span>
                        <div className={styles.zoneInfo}>
                          <strong>{zone.name}</strong>
                          <div className={styles.zoneType}>{zone.type.replace('_', ' ')}</div>
                        </div>
                        <div className={styles.zoneDistance}>{formatDistance(zone.distance)}</div>
                      </div>
                      <div className={styles.zoneDescription}>{zone.description}</div>
                      <div className={styles.zoneSeverity}>
                        <span 
                          className={`${styles.severityBadge} ${styles[zone.severity]}`}
                        >
                          {zone.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone Detail Modal */}
      {selectedZone && (
        <div className={styles.modalOverlay} onClick={() => setSelectedZone(null)}>
          <div className={styles.zoneModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{getZoneIcon(selectedZone)} {selectedZone.name}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setSelectedZone(null)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.zoneDetails}>
                <div className={styles.detailRow}>
                  <strong>Type:</strong> {selectedZone.type.replace('_', ' ')}
                </div>
                <div className={styles.detailRow}>
                  <strong>Security Level:</strong> 
                  <span 
                    className={`${styles.severityBadge} ${styles[selectedZone.severity]}`}
                  >
                    {selectedZone.severity.toUpperCase()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Distance:</strong> {formatDistance(
                    nearbyZones.find(z => z.id === selectedZone.id)?.distance || 0
                  )}
                </div>
                {selectedZone.radius && (
                  <div className={styles.detailRow}>
                    <strong>Radius:</strong> {selectedZone.radius}m
                  </div>
                )}
                {selectedZone.contact && (
                  <div className={styles.detailRow}>
                    <strong>Contact:</strong> {selectedZone.contact}
                  </div>
                )}
              </div>
              
              <div className={styles.zoneDescription}>
                <strong>Description:</strong>
                <p>{selectedZone.description}</p>
              </div>

              <div className={styles.restrictions}>
                <strong>Restrictions & Guidelines:</strong>
                <ul>
                  {selectedZone.restrictions.map((restriction, index) => (
                    <li key={index}>{restriction}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.directionsBtn}
                  onClick={() => window.open(`https://www.google.com/maps/dir/${userLocation.coordinates.lat},${userLocation.coordinates.lng}/${selectedZone.coordinates.lat},${selectedZone.coordinates.lng}`, '_blank')}
                >
                  🧭 Get Directions
                </button>
                <button 
                  className={styles.reportBtn}
                  onClick={() => alert('Security incident reporting feature would be implemented here')}
                >
                  🚨 Report Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMap;