import { GeofenceViolation, GeofenceZone } from '../types/geofence';

interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

interface AlertEmailData {
  userEmail: string;
  userName: string;
  zoneName: string;
  violationType: 'enter' | 'exit';
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  zoneType: 'safe' | 'restricted' | 'warning';
}

export async function sendGeofenceAlert(
  violation: GeofenceViolation,
  user: User,
  zoneType: 'safe' | 'restricted' | 'warning'
): Promise<boolean> {
  try {
    const alertData: AlertEmailData = {
      userEmail: user.email,
      userName: violation.userName,
      zoneName: violation.zoneName,
      violationType: violation.violationType,
      location: violation.location,
      timestamp: violation.timestamp.toISOString(),
      zoneType: zoneType
    };

    const response = await fetch('/api/geofence/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send alert email:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Alert email sent successfully:', result);
    return true;

  } catch (error) {
    console.error('Error sending geofence alert:', error);
    return false;
  }
}

export async function sendBulkGeofenceAlert(
  violation: GeofenceViolation,
  users: User[],
  zoneType: 'safe' | 'restricted' | 'warning'
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    users.map(user => sendGeofenceAlert(violation, user, zoneType))
  );

  const success = results.filter(result => 
    result.status === 'fulfilled' && result.value === true
  ).length;
  
  const failed = results.length - success;

  return { success, failed };
}

// Function to get user by ID
export function getUserById(users: User[], userId: string): User | undefined {
  return users.find(user => user.id === userId);
}

// Function to send alert for zone entry/exit
export async function handleZoneViolation(
  violation: GeofenceViolation,
  users: User[],
  zones: GeofenceZone[],
  config: { alertsEnabled: boolean; autoAlerts: boolean }
): Promise<void> {
  if (!config.alertsEnabled) {
    console.log('Alerts are disabled');
    return;
  }

  const user = getUserById(users, violation.userId);
  if (!user) {
    console.error('User not found for violation:', violation.userId);
    return;
  }

  const zone = zones.find(z => z.id === violation.zoneId);
  if (!zone) {
    console.error('Zone not found for violation:', violation.zoneId);
    return;
  }

  // Only send alerts for restricted zones or if auto alerts are enabled
  if (zone.type === 'restricted' || config.autoAlerts) {
    const success = await sendGeofenceAlert(violation, user, zone.type);
    
    if (success) {
      console.log(`Alert sent to ${user.email} for ${zone.type} zone violation`);
    } else {
      console.error(`Failed to send alert to ${user.email}`);
    }
  }
}