import React, { useState, useEffect } from "react";
import styles from "../../styles/geofence.module.css";
import {
  GeofenceZone,
  UserLocation,
  GeofenceViolation,
  GeofenceConfig,
} from "../../types/geofence";
import {
  saveGeofenceZone,
  getGeofenceZones,
  updateGeofenceZone,
  deleteGeofenceZone,
  saveUserLocation,
  saveGeofenceViolation,
  subscribeToGeofenceZones,
  subscribeToViolations,
  saveAdminAction,
} from "../../lib/firebase";
import {
  simulateLocationUpdate,
  checkGeofenceViolations,
} from "../../utils/geofence";
import GeofenceMap from "./GeofenceMap";

interface FirebaseGeofenceManagerProps {
  users: any[];
  adminEmail: string;
  onViolationDetected: (violation: GeofenceViolation) => void;
}

const FirebaseGeofenceManager: React.FC<FirebaseGeofenceManagerProps> = ({
  users,
  adminEmail,
  onViolationDetected,
}) => {
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [violations, setViolations] = useState<GeofenceViolation[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<GeofenceZone | null>(null);
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [config, setConfig] = useState<GeofenceConfig>({
    trackingInterval: 5000,
    alertsEnabled: true,
    autoAlerts: true,
    notificationSound: true,
  });

  // Load geofence zones from Firebase on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const zonesResult = await getGeofenceZones();
        if (zonesResult.success) {
          setGeofenceZones(zonesResult.zones);
        }
      } catch (error) {
        console.error("Error loading geofence zones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to real-time updates
    const unsubscribeZones = subscribeToGeofenceZones((zones) => {
      setGeofenceZones(zones);
    });

    const unsubscribeViolations = subscribeToViolations((violations) => {
      setViolations(violations);
    });

    return () => {
      unsubscribeZones();
      unsubscribeViolations();
    };
  }, []);

  // Real-time tracking simulation with Firebase storage
  useEffect(() => {
    if (!isTracking || geofenceZones.length === 0) return;

    const interval = setInterval(async () => {
      const updatedLocations = simulateLocationUpdate(users, geofenceZones);
      setUserLocations(updatedLocations);

      // Save locations to Firebase and check for violations
      for (const location of updatedLocations) {
        try {
          // Save location to Firebase
          await saveUserLocation(location);

          // Check for violations
          const { violations: newViolations } = checkGeofenceViolations(
            location,
            geofenceZones
          );

          for (const violation of newViolations) {
            // Save violation to Firebase
            await saveGeofenceViolation(violation);

            // Log admin action
            await saveAdminAction({
              adminEmail,
              action: "GEOFENCE_VIOLATION_DETECTED",
              details: {
                userId: violation.userId,
                zoneName: violation.zoneName,
                violationType: violation.violationType,
              },
              timestamp: new Date(),
            });

            if (config.alertsEnabled) {
              onViolationDetected(violation);
              if (config.notificationSound) {
                // Play notification sound
                try {
                  const audio = new Audio("/notification.mp3");
                  audio.play().catch(() => {});
                } catch (error) {
                  console.log("Could not play notification sound");
                }
              }
            }
          }
        } catch (error) {
          console.error("Error saving location or violation:", error);
        }
      }
    }, config.trackingInterval);

    return () => clearInterval(interval);
  }, [
    isTracking,
    geofenceZones,
    users,
    config,
    adminEmail,
    onViolationDetected,
  ]);

  const handleCreateZone = async (zoneData: Partial<GeofenceZone>) => {
    try {
      const newZone: GeofenceZone = {
        id: `gf-${Date.now()}`,
        name: zoneData.name || "New Zone",
        description: zoneData.description || "",
        center: zoneData.center || { lat: 28.6139, lng: 77.209 },
        radius: zoneData.radius || 100,
        type: zoneData.type || "safe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        color: zoneData.color || "#10B981",
      };

      const result = await saveGeofenceZone(newZone);

      if (result.success) {
        // Log admin action
        await saveAdminAction({
          adminEmail,
          action: "GEOFENCE_ZONE_CREATED",
          details: { zoneName: newZone.name, zoneType: newZone.type },
          timestamp: new Date(),
        });

        setShowCreateZone(false);
        // Real-time subscription will update the state
      } else {
        alert("Failed to create geofence zone: " + result.error);
      }
    } catch (error) {
      console.error("Error creating zone:", error);
      alert("Error creating geofence zone");
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const zone = geofenceZones.find((z) => z.id === zoneId);
      const result = await deleteGeofenceZone(zoneId);

      if (result.success) {
        // Log admin action
        await saveAdminAction({
          adminEmail,
          action: "GEOFENCE_ZONE_DELETED",
          details: { zoneName: zone?.name || "Unknown" },
          timestamp: new Date(),
        });

        if (selectedZone?.id === zoneId) {
          setSelectedZone(null);
        }
        // Real-time subscription will update the state
      } else {
        alert("Failed to delete geofence zone: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting zone:", error);
      alert("Error deleting geofence zone");
    }
  };

  const handleToggleZone = async (zoneId: string) => {
    try {
      const zone = geofenceZones.find((z) => z.id === zoneId);
      if (!zone) return;

      const result = await updateGeofenceZone(zoneId, {
        isActive: !zone.isActive,
        updatedAt: new Date(),
      });

      if (result.success) {
        // Log admin action
        await saveAdminAction({
          adminEmail,
          action: zone.isActive
            ? "GEOFENCE_ZONE_DEACTIVATED"
            : "GEOFENCE_ZONE_ACTIVATED",
          details: { zoneName: zone.name },
          timestamp: new Date(),
        });
        // Real-time subscription will update the state
      } else {
        alert("Failed to toggle geofence zone: " + result.error);
      }
    } catch (error) {
      console.error("Error toggling zone:", error);
      alert("Error toggling geofence zone");
    }
  };

  const handleStartStopTracking = async () => {
    const newTrackingState = !isTracking;
    setIsTracking(newTrackingState);

    // Log admin action
    await saveAdminAction({
      adminEmail,
      action: newTrackingState ? "TRACKING_STARTED" : "TRACKING_STOPPED",
      details: { timestamp: new Date() },
      timestamp: new Date(),
    });
  };

  const getZoneStats = () => {
    const totalZones = geofenceZones.length;
    const activeZones = geofenceZones.filter((z) => z.isActive).length;
    const recentViolations = violations.filter(
      (v) => Date.now() - new Date(v.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length;
    const usersBeingTracked = userLocations.length;

    return { totalZones, activeZones, recentViolations, usersBeingTracked };
  };

  const stats = getZoneStats();

  if (loading) {
    return (
      <div className={styles.geofenceManager}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h3>Loading Geofencing System...</h3>
          <p>Connecting to Firebase database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.geofenceManager}>
      <div className={styles.header}>
        <h2>🛡️ Firebase Geofence Tracking System</h2>
        <div className={styles.controls}>
          <button
            onClick={handleStartStopTracking}
            className={`${styles.trackingBtn} ${
              isTracking ? styles.active : ""
            }`}
          >
            {isTracking ? "⏸️ Stop Tracking" : "▶️ Start Tracking"}
          </button>
          <button
            onClick={() => setShowCreateZone(true)}
            className={styles.createBtn}
          >
            ➕ Create Zone
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalZones}</h3>
            <p>Total Zones</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>{stats.activeZones}</h3>
            <p>Active Zones</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>{stats.usersBeingTracked}</h3>
            <p>Users Tracked</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statInfo}>
            <h3>{stats.recentViolations}</h3>
            <p>Today's Violations</p>
          </div>
        </div>
      </div>

      {/* Firebase Status Indicator */}
      <div className={styles.firebaseStatus}>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot}></span>
          <span>Connected to Firebase</span>
        </div>
        <p>Real-time data synchronization active</p>
      </div>

      {/* Configuration Panel */}
      <div className={styles.configPanel}>
        <h3>⚙️ Tracking Configuration</h3>
        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <label>Tracking Interval (seconds)</label>
            <input
              title="number"
              type="number"
              min="1"
              max="60"
              value={config.trackingInterval / 1000}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  trackingInterval: parseInt(e.target.value) * 1000,
                }))
              }
            />
          </div>
          <div className={styles.configItem}>
            <label>
              <input
                type="checkbox"
                checked={config.alertsEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    alertsEnabled: e.target.checked,
                  }))
                }
              />
              Enable Alerts
            </label>
          </div>
          <div className={styles.configItem}>
            <label>
              <input
                type="checkbox"
                checked={config.autoAlerts}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    autoAlerts: e.target.checked,
                  }))
                }
              />
              Auto Alerts
            </label>
          </div>
          <div className={styles.configItem}>
            <label>
              <input
                type="checkbox"
                checked={config.notificationSound}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    notificationSound: e.target.checked,
                  }))
                }
              />
              Sound Notifications
            </label>
          </div>
        </div>
      </div>

      {/* Geofence Zones List */}
      <div className={styles.zonesSection}>
        <h3>📍 Geofence Zones (Stored in Firebase)</h3>
        <div className={styles.zonesList}>
          {geofenceZones.map((zone) => (
            <div
              key={zone.id}
              className={`${styles.zoneCard} ${
                !zone.isActive ? styles.inactive : ""
              }`}
            >
              <div className={styles.zoneHeader}>
                <div className={styles.zoneInfo}>
                  <h4>{zone.name}</h4>
                  <p>{zone.description}</p>
                  <span className={`${styles.zoneType} ${styles[zone.type]}`}>
                    {zone.type.toUpperCase()}
                  </span>
                </div>
                <div className={styles.zoneActions}>
                  <button
                    onClick={() => handleToggleZone(zone.id)}
                    className={`${styles.toggleBtn} ${
                      zone.isActive ? styles.active : ""
                    }`}
                  >
                    {zone.isActive ? "🟢" : "🔴"}
                  </button>
                  <button
                    onClick={() => setSelectedZone(zone)}
                    className={styles.editBtn}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className={styles.deleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.zoneDetails}>
                <p>
                  📍 Center: {zone.center.lat.toFixed(4)},{" "}
                  {zone.center.lng.toFixed(4)}
                </p>
                <p>📏 Radius: {zone.radius}m</p>
                <p>🕒 Updated: {new Date(zone.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div className={styles.mapSection}>
        <h3>🗺️ Real-time Geofence Map</h3>
        <div className={styles.mapContainer}>
          <GeofenceMap
            geofenceZones={geofenceZones}
            userLocations={userLocations}
            height="600px"
            width="100%"
          />
        </div>
      </div>

      {/* Live User Tracking */}
      {isTracking && (
        <div className={styles.liveTracking}>
          <h3>📡 Live User Tracking (Synced with Firebase)</h3>
          <div className={styles.usersList}>
            {userLocations.map((location) => (
              <div key={location.userId} className={styles.userLocation}>
                <div className={styles.userInfo}>
                  <h4>{location.userName}</h4>
                  <p>
                    📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                  <p>🎯 Accuracy: ±{location.accuracy?.toFixed(1)}m</p>
                  <p>🕒 {new Date(location.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className={styles.userStatus}>
                  <span
                    className={`${styles.statusBadge} ${
                      location.isInside ? styles.inside : styles.outside
                    }`}
                  >
                    {location.isInside ? "🟢 Inside Zone" : "🔴 Outside"}
                  </span>
                  {location.violatedZones.length > 0 && (
                    <span className={styles.violationsBadge}>
                      ⚠️ {location.violatedZones.length} zones
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Violations from Firebase */}
      {violations.length > 0 && (
        <div className={styles.violationsSection}>
          <h3>🚨 Recent Violations (Firebase Database)</h3>
          <div className={styles.violationsList}>
            {violations.slice(0, 10).map((violation) => (
              <div key={violation.id} className={styles.violationCard}>
                <div className={styles.violationHeader}>
                  <h4>{violation.userName}</h4>
                  <span className={styles.violationType}>
                    {violation.violationType === "enter"
                      ? "🚪➡️ ENTERED"
                      : "🚪⬅️ EXITED"}
                  </span>
                </div>
                <p>
                  <strong>Zone:</strong> {violation.zoneName}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {new Date(violation.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>Location:</strong> {violation.location.lat.toFixed(4)}
                  , {violation.location.lng.toFixed(4)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {violation.isResolved ? "✅ Resolved" : "⏳ Pending"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Zone Modal */}
      {showCreateZone && (
        <CreateZoneModal
          onClose={() => setShowCreateZone(false)}
          onCreate={handleCreateZone}
        />
      )}

      {/* Zone Details Modal */}
      {selectedZone && (
        <ZoneDetailsModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          onUpdate={async (updatedZone) => {
            try {
              const result = await updateGeofenceZone(
                updatedZone.id,
                updatedZone
              );
              if (result.success) {
                await saveAdminAction({
                  adminEmail,
                  action: "GEOFENCE_ZONE_UPDATED",
                  details: { zoneName: updatedZone.name },
                  timestamp: new Date(),
                });
                setSelectedZone(null);
              } else {
                alert("Failed to update zone: " + result.error);
              }
            } catch (error) {
              console.error("Error updating zone:", error);
              alert("Error updating zone");
            }
          }}
        />
      )}
    </div>
  );
};

// Create Zone Modal Component (same as before but with Firebase integration)
const CreateZoneModal: React.FC<{
  onClose: () => void;
  onCreate: (zone: Partial<GeofenceZone>) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: 28.6139,
    lng: 77.209,
    radius: 100,
    type: "safe" as "safe" | "restricted" | "warning",
    color: "#10B981",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: formData.name,
      description: formData.description,
      center: { lat: formData.lat, lng: formData.lng },
      radius: formData.radius,
      type: formData.type,
      color: formData.color,
    });
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h3>Create New Geofence Zone (Firebase)</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Zone Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              placeholder="Enter zone name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter zone description"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Latitude</label>
              <input
              title="number"
                type="number"
                step="0.000001"
                value={formData.lat}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lat: parseFloat(e.target.value),
                  }))
                }
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Longitude</label>
              <input
                title="number"
                type="number"
                step="0.000001"
                value={formData.lng}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lng: parseFloat(e.target.value),
                  }))
                }
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Radius (meters)</label>
              <input  title="number"
                type="number"
                min="10"
                max="10000"
                value={formData.radius}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    radius: parseInt(e.target.value),
                  }))
                }
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Zone Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as any,
                  }))
                }
                title="Select zone type"
              >
                <option value="safe">Safe Zone</option>
                <option value="warning">Warning Zone</option>
                <option value="restricted">Restricted Zone</option>
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Zone Color</label>
            <input
              title="number"
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button type="submit" className={styles.createBtn}>
              Create Zone in Firebase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Zone Details Modal Component
const ZoneDetailsModal: React.FC<{
  zone: GeofenceZone;
  onClose: () => void;
  onUpdate: (zone: GeofenceZone) => void;
}> = ({ zone, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: zone.name,
    description: zone.description,
    lat: zone.center.lat,
    lng: zone.center.lng,
    radius: zone.radius,
    type: zone.type,
    color: zone.color || "#10B981",
  });

  const handleUpdate = () => {
    const updatedZone: GeofenceZone = {
      ...zone,
      name: formData.name,
      description: formData.description,
      center: { lat: formData.lat, lng: formData.lng },
      radius: formData.radius,
      type: formData.type,
      color: formData.color,
      updatedAt: new Date(),
    };
    onUpdate(updatedZone);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Zone Details (Firebase)</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        {editMode ? (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label>Zone Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Zone name"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Zone description"
              />
            </div>
            <div className={styles.formActions}>
              <button
                onClick={() => setEditMode(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={handleUpdate} className={styles.saveBtn}>
                Save to Firebase
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.zoneDetails}>
            <p>
              <strong>Name:</strong> {zone.name}
            </p>
            <p>
              <strong>Description:</strong> {zone.description}
            </p>
            <p>
              <strong>Type:</strong>{" "}
              <span className={`${styles.zoneType} ${styles[zone.type]}`}>
                {zone.type}
              </span>
            </p>
            <p>
              <strong>Center:</strong> {zone.center.lat.toFixed(6)},{" "}
              {zone.center.lng.toFixed(6)}
            </p>
            <p>
              <strong>Radius:</strong> {zone.radius} meters
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {zone.isActive ? "🟢 Active" : "🔴 Inactive"}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(zone.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Updated:</strong>{" "}
              {new Date(zone.updatedAt).toLocaleString()}
            </p>

            <button
              onClick={() => setEditMode(true)}
              className={styles.editBtn}
            >
              Edit Zone
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseGeofenceManager;
