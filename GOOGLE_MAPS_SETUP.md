# Google Maps API Setup Guide

## Current Status
The geofencing system is currently using a **fallback SVG map** which provides full functionality including:
- ✅ Zone visualization and management
- ✅ Real-time user tracking
- ✅ Violation detection and alerts
- ✅ Interactive controls

## Setting up Google Maps API (Optional)

To enable Google Maps instead of the SVG fallback:

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing (required for Maps API)

### 2. Enable APIs
Enable these APIs in your project:
- **Maps JavaScript API**
- **Geocoding API** (optional, for address search)
- **Places API** (optional, for location search)

### 3. Create API Key
1. Go to "Credentials" in Google Cloud Console
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 4. Secure API Key (Recommended)
1. Click on your API key to edit
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain: `yourdomain.com/*`
   - For development: `localhost:3000/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose only the APIs you enabled above

### 5. Add to Environment Variables
Create `.env.local` file in your project root:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 6. Switch to Google Maps
Once you have a valid API key, update `GeofenceManager.tsx`:

```tsx
// Replace FallbackMap with GeofenceMap
import GeofenceMap from './GeofenceMap';

// In the map section:
<GeofenceMap
  geofenceZones={geofenceZones}
  userLocations={userLocations}
  height="600px"
  width="100%"
/>
```

## Cost Considerations
- Google Maps API has usage-based pricing
- Free tier: $200 credit per month
- Typical usage for this app should stay within free limits
- Monitor usage in Google Cloud Console

## Current Fallback Map Features
The SVG fallback map provides:
- 🗺️ Interactive zone visualization
- 📍 Real-time user markers
- 🎯 Zone boundary indicators
- 📊 Statistics and legends
- 🖱️ Click-to-zoom functionality
- 📱 Mobile responsive design

The geofencing system is **fully functional** with or without Google Maps!