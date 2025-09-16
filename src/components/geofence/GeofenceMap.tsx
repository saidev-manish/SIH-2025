/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { GeofenceZone, UserLocation } from '../../types/geofence';
import styles from '../../styles/geofence.module.css';

interface GeofenceMapProps {
  geofenceZones: GeofenceZone[];
  userLocations: UserLocation[];
  onMapReady?: (map: google.maps.Map) => void;
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

const GeofenceMap: React.FC<GeofenceMapProps> = ({
  geofenceZones,
  userLocations,
  onMapReady
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    // For development, show fallback map instead of loading Google Maps
    // You can replace 'YOUR_GOOGLE_MAPS_API_KEY' with a real API key
    const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
    
    if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Show fallback for development
      setIsLoaded(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      setIsLoaded(true);
    };
    
    script.onload = () => {
      window.initMap();
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi, India
    
    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: defaultCenter,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);
    onMapReady?.(newMap);
  }, [isLoaded, onMapReady]);

  // Update geofence zones on map
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing circles
    circlesRef.current.forEach(circle => circle.setMap(null));
    circlesRef.current = [];

    // Add new circles for active zones
    geofenceZones.forEach(zone => {
      if (!zone.isActive) return;

      const circle = new window.google.maps.Circle({
        strokeColor: zone.color || '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zone.color || '#FF0000',
        fillOpacity: zone.type === 'restricted' ? 0.35 : 0.15,
        map: map,
        center: zone.center,
        radius: zone.radius,
        clickable: true
      });

      // Add info window for zone details
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; color: ${zone.color};">${zone.name}</h3>
            <p style="margin: 5px 0; font-size: 12px;">${zone.description}</p>
            <p style="margin: 5px 0; font-size: 11px;">
              <strong>Type:</strong> ${zone.type.toUpperCase()}<br>
              <strong>Radius:</strong> ${zone.radius}m<br>
              <strong>Status:</strong> ${zone.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        `
      });

      circle.addListener('click', () => {
        infoWindow.setPosition(zone.center);
        infoWindow.open(map);
      });

      circlesRef.current.push(circle);
    });
  }, [map, geofenceZones]);

  // Update user markers on map
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for users
    userLocations.forEach(userLocation => {
      const isInViolation = userLocation.violatedZones.length > 0;
      
      const marker = new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        title: userLocation.userName,
        icon: {
          url: isInViolation 
            ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `)
            : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
                  <path d="M9 12l2 2 4-4" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });

      // Add info window for user details
      const userInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 5px 0; color: ${isInViolation ? '#EF4444' : '#10B981'};">
              ${userLocation.userName}
            </h3>
            <p style="margin: 5px 0; font-size: 12px;">
              <strong>Status:</strong> ${userLocation.isInside ? 'Inside Geofence' : 'Outside Geofence'}<br>
              <strong>Accuracy:</strong> ±${userLocation.accuracy?.toFixed(1)}m<br>
              <strong>Last Update:</strong> ${userLocation.timestamp.toLocaleTimeString()}
            </p>
            ${isInViolation ? `
              <p style="margin: 5px 0; font-size: 11px; color: #EF4444;">
                <strong>⚠️ VIOLATION:</strong> In ${userLocation.violatedZones.length} restricted zone(s)
              </p>
            ` : ''}
            <p style="margin: 5px 0; font-size: 11px; color: #64748B;">
              Coordinates: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        userInfoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit map bounds to show all users and zones
    if (userLocations.length > 0 || geofenceZones.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      userLocations.forEach(user => {
        bounds.extend(new window.google.maps.LatLng(user.lat, user.lng));
      });
      
      geofenceZones.forEach(zone => {
        if (zone.isActive) {
          bounds.extend(new window.google.maps.LatLng(zone.center.lat, zone.center.lng));
        }
      });
      
      map.fitBounds(bounds);
    }
  }, [map, userLocations]);

  if (!isLoaded) {
    return (
      <div className={styles.mapLoadingContainer}>
        <div className={styles.mapLoadingContent}>
          <div className={styles.mapLoadingIcon}>🗺️</div>
          <div>Loading Google Maps...</div>
          <div className={styles.mapLoadingSubtext}>
            Please ensure you have a valid Google Maps API key
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div 
        ref={mapRef} 
        className={styles.mapContainer}
      />
      
      {/* Map Legend */}
      <div className={styles.mapLegend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.legendIconSafe}`}></div>
          <span>User (Safe)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.legendIconViolation}`}></div>
          <span>User (Violation)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.legendIconSafeZone}`}></div>
          <span>Safe Zone</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.legendIconWarningZone}`}></div>
          <span>Warning Zone</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.legendIconRestrictedZone}`}></div>
          <span>Restricted Zone</span>
        </div>
      </div>
    </div>
  );
};

export default GeofenceMap;