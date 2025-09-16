import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/geofence.module.css';
import { handleZoneViolation } from '../../utils/emailAlerts';

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

interface GeofenceConfig {
  trackingEnabled: boolean;
  alertsEnabled: boolean;
  updateInterval: number;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
}

// Sample users with real email addresses from dashboard
const sampleUsers: UserLocation[] = [
  {
    id: '1',
    name: 'saidev',
    position: { lat: 28.6139, lng: 77.2090 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'saidevmanish@gmail.com'
  },
  {
    id: '2', 
    name: 'saidurga',
    position: { lat: 19.0760, lng: 72.8777 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'saidurgamamulla@gmail.com'
  },
  {
    id: '3',
    name: 'Michael Chen', 
    position: { lat: 12.9716, lng: 77.5946 },
    status: 'safe',
    lastUpdate: new Date(),
    email: '24e51a67c3@gmail.com'
  },
  {
    id: '4',
    name: 'Emily Davis',
    position: { lat: 13.0827, lng: 80.2707 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'juturujoshitha@email.com'
  },
  {
    id: '5',
    name: 'Robert Wilson',
    position: { lat: 22.5726, lng: 88.3639 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'r.wilson@email.com'
  },
  {
    id: '6',
    name: 'Priya Sharma',
    position: { lat: 26.9124, lng: 75.7873 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'priya.sharma@email.com'
  },
  {
    id: '7',
    name: 'David Martinez',
    position: { lat: 21.1458, lng: 79.0882 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'david.martinez@email.com'
  },
  {
    id: '8',
    name: 'Anjali Patel',
    position: { lat: 23.0225, lng: 72.5714 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'anjali.patel@email.com'
  },
  {
    id: '9',
    name: 'James Anderson',
    position: { lat: 17.3850, lng: 78.4867 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'james.anderson@email.com'
  },
  {
    id: '10',
    name: 'Ravi Kumar',
    position: { lat: 25.5941, lng: 85.1376 },
    status: 'safe',
    lastUpdate: new Date(),
    email: 'ravi.kumar@email.com'
  }
];

// Sample geofence zones
const sampleZones: GeofenceZone[] = [
  {
    id: 'zone-1',
    name: 'Safe Zone Alpha',
    description: 'Main safe area for personnel',
    center: { lat: 28.6139, lng: 77.2090 },
    radius: 200,
    type: 'safe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    color: '#10B981'
  },
  {
    id: 'zone-2',
    name: 'Restricted Area Beta',
    description: 'High security zone - authorized personnel only',
    center: { lat: 28.6170, lng: 77.2120 },
    radius: 150,
    type: 'restricted',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    color: '#EF4444'
  },
  {
    id: 'zone-3',
    name: 'Warning Zone Gamma',
    description: 'Caution required in this area',
    center: { lat: 28.6110, lng: 77.2050 },
    radius: 100,
    type: 'warning',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    color: '#F59E0B'
  }
];

const GeofenceManager: React.FC = () => {
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>(sampleZones);
  const [userLocations, setUserLocations] = useState<UserLocation[]>(sampleUsers);
  const [config, setConfig] = useState<GeofenceConfig>({
    trackingEnabled: false,
    alertsEnabled: true,
    updateInterval: 5000,
    mapCenter: { lat: 28.6139, lng: 77.2090 },
    mapZoom: 13
  });
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [selectedMapType, setSelectedMapType] = useState<'openstreetmap' | 'fallback'>('openstreetmap');
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Check if user is within a geofence zone
  const checkUserInZone = useCallback((userPos: { lat: number; lng: number }, zone: GeofenceZone): boolean => {
    const distance = calculateDistance(userPos, zone.center);
    return distance <= zone.radius;
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Update user locations and check for zone violations
  const updateUserLocations = useCallback(() => {
    if (!config.trackingEnabled) return;

    setUserLocations(prevUsers => {
      return prevUsers.map(user => {
        // Simulate small random movement
        const newPosition = {
          lat: user.position.lat + (Math.random() - 0.5) * 0.001,
          lng: user.position.lng + (Math.random() - 0.5) * 0.001
        };

        let status: 'safe' | 'warning' | 'danger' = 'safe';
        let inZone: string | undefined;

        // Check against all active zones
        for (const zone of geofenceZones.filter(z => z.isActive)) {
          if (checkUserInZone(newPosition, zone)) {
            inZone = zone.id;
            switch (zone.type) {
              case 'restricted':
                status = 'danger';
                // Send email alert for restricted zone violation
                if (config.alertsEnabled && user.email) {
                  const violation = {
                    id: `violation-${Date.now()}`,
                    userId: user.id,
                    userName: user.name,
                    zoneId: zone.id,
                    zoneName: zone.name,
                    violationType: 'enter' as const,
                    timestamp: new Date(),
                    location: newPosition,
                    isResolved: false
                  };
                  const userForEmail = { id: user.id, name: user.name, email: user.email };
                  handleZoneViolation(violation, [userForEmail], [zone], { alertsEnabled: config.alertsEnabled, autoAlerts: true }).catch(console.error);
                }
                break;
              case 'warning':
                status = 'warning';
                break;
              case 'safe':
                status = 'safe';
                break;
            }
            break;
          }
        }

        return {
          ...user,
          position: newPosition,
          status,
          lastUpdate: new Date(),
          inZone
        };
      });
    });
  }, [config.trackingEnabled, config.alertsEnabled, geofenceZones, checkUserInZone]);

  // Start/stop user location updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (config.trackingEnabled) {
      interval = setInterval(updateUserLocations, config.updateInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [config.trackingEnabled, config.updateInterval, updateUserLocations]);

  const handleCreateZone = (zoneData: Partial<GeofenceZone>) => {
    const newZone: GeofenceZone = {
      id: `zone-${Date.now()}`,
      name: zoneData.name || 'New Zone',
      description: zoneData.description || '',
      center: zoneData.center || { lat: 28.6139, lng: 77.2090 },
      radius: zoneData.radius || 100,
      type: zoneData.type || 'safe',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      color: zoneData.color || '#10B981'
    };
    
    setGeofenceZones(prev => [...prev, newZone]);
    setShowCreateZone(false);
  };

  const handleSendTestAlert = async () => {
    if (!config.alertsEnabled) {
      alert('❌ Email alerts are disabled. Please enable alerts first.');
      return;
    }

    if (userLocations.length === 0) {
      alert('❌ No users are currently being tracked. Start tracking first.');
      return;
    }

    // Find a restricted zone for testing
    const restrictedZone = geofenceZones.find(zone => zone.type === 'restricted' && zone.isActive);
    if (!restrictedZone) {
      alert('❌ No active restricted zones found. Create a restricted zone first.');
      return;
    }

    // Use the first user with email for testing
    const testUser = userLocations.find(user => user.email);
    if (!testUser) {
      alert('❌ No users with email addresses found.');
      return;
    }

    try {
      const violation = {
        id: `violation-${Date.now()}`,
        userId: testUser.id,
        userName: testUser.name,
        zoneId: restrictedZone.id,
        zoneName: restrictedZone.name,
        violationType: 'enter' as const,
        timestamp: new Date(),
        location: testUser.position,
        isResolved: false
      };
      const userForEmail = { id: testUser.id, name: testUser.name, email: testUser.email! };
      await handleZoneViolation(violation, [userForEmail], [restrictedZone], { alertsEnabled: config.alertsEnabled, autoAlerts: true });
      alert(`✅ Test alert sent successfully to ${testUser.email}!`);
    } catch (error) {
      console.error('Failed to send test alert:', error);
      alert('❌ Failed to send test alert. Check console for details.');
    }
  };

  const handleTestEmailConfig = async () => {
    const email = prompt('Enter email address to test email configuration:', 'saidevmanish@gmail.com');
    if (!email) return;

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Test email sent successfully to ${email}!\n\nCheck your inbox (and spam folder) for the test email.`);
      } else {
        console.error('Email test failed:', result);
        alert(`❌ Email test failed: ${result.message}\n\nCheck console for details and ensure your .env.local file has correct Gmail credentials.`);
      }
    } catch (error) {
      console.error('Email test error:', error);
      alert('❌ Failed to test email configuration. Check console for details.');
    }
  };

  const toggleTracking = () => {
    setConfig(prev => ({ ...prev, trackingEnabled: !prev.trackingEnabled }));
    setSimulationRunning(!simulationRunning);
  };

  const toggleAlerts = () => {
    setConfig(prev => ({ ...prev, alertsEnabled: !prev.alertsEnabled }));
  };

  const deleteZone = (zoneId: string) => {
    setGeofenceZones(prev => prev.filter(zone => zone.id !== zoneId));
  };

  const toggleZoneActive = (zoneId: string) => {
    setGeofenceZones(prev => 
      prev.map(zone => 
        zone.id === zoneId 
          ? { ...zone, isActive: !zone.isActive, updatedAt: new Date() }
          : zone
      )
    );
  };

  const renderMap = () => {
    if (selectedMapType === 'openstreetmap') {
      try {
        const OpenStreetMap = React.lazy(() => import('./OpenStreetMap'));
        return (
          <React.Suspense fallback={<div className={styles.mapLoading}>Loading Map...</div>}>
            <OpenStreetMap
              zones={geofenceZones.filter(zone => zone.isActive)}
              users={userLocations}
              center={config.mapCenter}
              zoom={config.mapZoom}
              onZoneCreate={handleCreateZone}
            />
          </React.Suspense>
        );
      } catch {
        console.warn('OpenStreetMap failed to load, falling back to SVG map');
        setSelectedMapType('fallback');
      }
    }

    if (selectedMapType === 'fallback') {
      const FallbackMap = React.lazy(() => import('./FallbackMap'));
      return (
        <React.Suspense fallback={<div className={styles.mapLoading}>Loading Map...</div>}>
          <FallbackMap
            zones={geofenceZones.filter(zone => zone.isActive)}
            users={userLocations}
            center={config.mapCenter}
            zoom={config.mapZoom}
            onZoneCreate={handleCreateZone}
          />
        </React.Suspense>
      );
    }
  };

  return (
    <div className={styles.geofenceManager}>
      <div className={styles.header}>
        <h1>🗺️ Interactive Geofence Map - Choose Your Map Type</h1>
        <div className={styles.controls}>
          <div className={styles.mapSelector}>
            <label>Map Type:</label>
            <select 
              value={selectedMapType} 
              onChange={(e) => setSelectedMapType(e.target.value as 'openstreetmap' | 'fallback')}
              className={styles.select}
            >
              <option value="openstreetmap">OpenStreetMap (Interactive)</option>
              <option value="fallback">Fallback Map (SVG)</option>
            </select>
          </div>
          
          <button 
            onClick={toggleTracking}
            className={`${styles.button} ${config.trackingEnabled ? styles.buttonDanger : styles.buttonSuccess}`}
          >
            {config.trackingEnabled ? '⏸️ Stop Tracking' : '▶️ Start Tracking'}
          </button>
          
          <button 
            onClick={toggleAlerts}
            className={`${styles.button} ${config.alertsEnabled ? styles.buttonSuccess : styles.buttonSecondary}`}
          >
            {config.alertsEnabled ? '🔔 Alerts ON' : '🔕 Alerts OFF'}
          </button>

          <button 
            onClick={handleSendTestAlert}
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={!config.alertsEnabled}
          >
            📧 Send Test Alert
          </button>

          <button 
            onClick={handleTestEmailConfig}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            🔧 Test Email Config
          </button>
          
          <button 
            onClick={() => setShowCreateZone(true)}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            ➕ Create Zone
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mapContainer}>
          {renderMap()}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h3>📊 System Status</h3>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Tracking:</span>
                <span className={`${styles.statusValue} ${config.trackingEnabled ? styles.statusActive : styles.statusInactive}`}>
                  {config.trackingEnabled ? '🟢 Active' : '🔴 Stopped'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Email Alerts:</span>
                <span className={`${styles.statusValue} ${config.alertsEnabled ? styles.statusActive : styles.statusInactive}`}>
                  {config.alertsEnabled ? '🔔 Enabled' : '🔕 Disabled'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Active Zones:</span>
                <span className={styles.statusValue}>
                  {geofenceZones.filter(zone => zone.isActive).length}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Tracked Users:</span>
                <span className={styles.statusValue}>
                  {userLocations.length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>👥 User Locations</h3>
            <div className={styles.userList}>
              {userLocations.map(user => (
                <div key={user.id} className={styles.userItem}>
                  <div className={styles.userInfo}>
                    <div className={`${styles.userStatus} ${styles[user.status]}`}>
                      {user.status === 'safe' ? '🟢' : user.status === 'warning' ? '🟡' : '🔴'}
                    </div>
                    <div className={styles.userDetails}>
                      <div className={styles.userName}>{user.name}</div>
                      <div className={styles.userPosition}>
                        📍 {user.position.lat.toFixed(4)}, {user.position.lng.toFixed(4)}
                      </div>
                      {user.email && (
                        <div className={styles.userEmail}>📧 {user.email}</div>
                      )}
                      {user.inZone && (
                        <div className={styles.userZone}>
                          🔹 In: {geofenceZones.find(z => z.id === user.inZone)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.userTimestamp}>
                    {user.lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>🗺️ Geofence Zones</h3>
            <div className={styles.zoneList}>
              {geofenceZones.map(zone => (
                <div key={zone.id} className={styles.zoneItem}>
                  <div className={styles.zoneInfo}>
                    <div 
                      className={`${styles.zoneColor} ${styles[zone.type]}`}
                    ></div>
                    <div className={styles.zoneDetails}>
                      <div className={styles.zoneName}>{zone.name}</div>
                      <div className={styles.zoneType}>
                        {zone.type === 'safe' ? '🟢 Safe Zone' : 
                         zone.type === 'warning' ? '🟡 Warning Zone' : 
                         '🔴 Restricted Zone'}
                      </div>
                      <div className={styles.zoneRadius}>📏 {zone.radius}m radius</div>
                    </div>
                  </div>
                  <div className={styles.zoneActions}>
                    <button 
                      onClick={() => toggleZoneActive(zone.id)}
                      className={`${styles.buttonSmall} ${zone.isActive ? styles.buttonSuccess : styles.buttonSecondary}`}
                      title={zone.isActive ? 'Deactivate Zone' : 'Activate Zone'}
                    >
                      {zone.isActive ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button 
                      onClick={() => deleteZone(zone.id)}
                      className={`${styles.buttonSmall} ${styles.buttonDanger}`}
                      title="Delete Zone"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCreateZone && (
        <CreateZoneModal 
          onClose={() => setShowCreateZone(false)}
          onCreate={handleCreateZone}
        />
      )}
    </div>
  );
};

// Create Zone Modal Component
const CreateZoneModal: React.FC<{
  onClose: () => void;
  onCreate: (zone: Partial<GeofenceZone>) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'safe' as 'safe' | 'warning' | 'restricted',
    radius: 100,
    lat: 28.6139,
    lng: 77.2090
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      radius: formData.radius,
      center: { lat: formData.lat, lng: formData.lng },
      color: formData.type === 'safe' ? '#10B981' : 
             formData.type === 'warning' ? '#F59E0B' : '#EF4444'
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create New Geofence Zone</h2>
          <button onClick={onClose} className={styles.modalClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="zoneName">Zone Name:</label>
            <input
              id="zoneName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className={styles.input}
              placeholder="Enter zone name"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="zoneDescription">Description:</label>
            <textarea
              id="zoneDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={styles.textarea}
              placeholder="Enter zone description"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="zoneType">Zone Type:</label>
            <select
              id="zoneType"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'safe' | 'warning' | 'restricted' }))}
              className={styles.select}
            >
              <option value="safe">🟢 Safe Zone</option>
              <option value="warning">🟡 Warning Zone</option>
              <option value="restricted">🔴 Restricted Zone</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="zoneRadius">Radius (meters):</label>
            <input
              id="zoneRadius"
              type="number"
              min="10"
              max="1000"
              value={formData.radius}
              onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className={styles.input}
              placeholder="Enter radius in meters"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="zoneLat">Latitude:</label>
              <input
                id="zoneLat"
                type="number"
                step="0.000001"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                className={styles.input}
                placeholder="Enter latitude"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="zoneLng">Longitude:</label>
              <input
                id="zoneLng"
                type="number"
                step="0.000001"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                className={styles.input}
                placeholder="Enter longitude"
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.buttonSecondary}`}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
              Create Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeofenceManager;