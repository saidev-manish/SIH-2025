// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { GeofenceZone, UserLocation, GeofenceViolation } from '../types/geofence';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzoytZqgiSJ_IAsRJy_H6brUiNlXl_BtY",
  authDomain: "safeyatri-5d204.firebaseapp.com",
  projectId: "safeyatri-5d204",
  storageBucket: "safeyatri-5d204.firebasestorage.app",
  messagingSenderId: "402008428152",
  appId: "1:402008428152:web:e2b779a7e466e55754678d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore Database
export const db = getFirestore(app);

// Authentication Functions
export const signInWithGoogle = async () => {
  try {
    console.log('Attempting Google sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('Google sign-in successful:', user.email);
    
    // Check if user is authorized admin (you can customize this logic)
    const adminRef = doc(db, 'admins', user.uid);
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      console.log('Creating new admin profile for:', user.email);
      // Create admin profile if doesn't exist
      await setDoc(adminRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        role: 'admin',
        isActive: true
      });
    }
    
    return { success: true, user };
  } catch (error: any) {
    console.error('Google sign-in error:', error.code, error.message);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Google authentication is not enabled. Please contact the administrator.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up was blocked by browser. Please allow pop-ups and try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const signOutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Geofence Zone Database Functions
export const saveGeofenceZone = async (zone: GeofenceZone) => {
  try {
    const docRef = await addDoc(collection(db, "geofenceZones"), {
      ...zone,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getGeofenceZones = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "geofenceZones"));
    const zones: GeofenceZone[] = [];
    querySnapshot.forEach((doc) => {
      zones.push({ ...doc.data(), id: doc.id } as GeofenceZone);
    });
    return { success: true, zones };
  } catch (error: any) {
    return { success: false, error: error.message, zones: [] };
  }
};

export const updateGeofenceZone = async (zoneId: string, updates: Partial<GeofenceZone>) => {
  try {
    const zoneRef = doc(db, "geofenceZones", zoneId);
    await updateDoc(zoneRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteGeofenceZone = async (zoneId: string) => {
  try {
    await deleteDoc(doc(db, "geofenceZones", zoneId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// User Location Database Functions
export const saveUserLocation = async (userLocation: UserLocation) => {
  try {
    const docRef = await addDoc(collection(db, "userLocations"), {
      ...userLocation,
      timestamp: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserLocations = async (userId?: string) => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, "userLocations"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        collection(db, "userLocations"),
        orderBy("timestamp", "desc")
      );
    }
    
    const querySnapshot = await getDocs(q);
    const locations: UserLocation[] = [];
    querySnapshot.forEach((doc) => {
      locations.push({ ...doc.data(), id: doc.id as string } as unknown as UserLocation);
    });
    return { success: true, locations };
  } catch (error: any) {
    return { success: false, error: error.message, locations: [] };
  }
};

// Geofence Violation Database Functions
export const saveGeofenceViolation = async (violation: GeofenceViolation) => {
  try {
    const docRef = await addDoc(collection(db, "geofenceViolations"), {
      ...violation,
      timestamp: new Date(),
      isResolved: false
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getGeofenceViolations = async (userId?: string, zoneId?: string) => {
  try {
    let q = query(
      collection(db, "geofenceViolations"),
      orderBy("timestamp", "desc")
    );

    if (userId) {
      q = query(q, where("userId", "==", userId));
    }
    
    if (zoneId) {
      q = query(q, where("zoneId", "==", zoneId));
    }
    
    const querySnapshot = await getDocs(q);
    const violations: GeofenceViolation[] = [];
    querySnapshot.forEach((doc) => {
      violations.push({ ...doc.data(), id: doc.id } as GeofenceViolation);
    });
    return { success: true, violations };
  } catch (error: any) {
    return { success: false, error: error.message, violations: [] };
  }
};

export const markViolationResolved = async (violationId: string) => {
  try {
    const violationRef = doc(db, "geofenceViolations", violationId);
    await updateDoc(violationRef, {
      isResolved: true,
      resolvedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Real-time listeners
export const subscribeToGeofenceZones = (callback: (zones: GeofenceZone[]) => void) => {
  const q = query(collection(db, "geofenceZones"), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const zones: GeofenceZone[] = [];
    snapshot.forEach((doc) => {
      zones.push({ ...doc.data(), id: doc.id } as GeofenceZone);
    });
    callback(zones);
  });
};

export const subscribeToUserLocations = (callback: (locations: UserLocation[]) => void) => {
  const q = query(collection(db, "userLocations"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const locations: UserLocation[] = [];
    snapshot.forEach((doc) => {
      locations.push({ ...doc.data(), id: doc.id } as unknown as UserLocation);
    });
    callback(locations);
  });
};

export const subscribeToViolations = (callback: (violations: GeofenceViolation[]) => void) => {
  const q = query(collection(db, "geofenceViolations"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const violations: GeofenceViolation[] = [];
    snapshot.forEach((doc) => {
      violations.push({ ...doc.data(), id: doc.id } as GeofenceViolation);
    });
    callback(violations);
  });
};

// Admin Management Functions
export const saveAdminAction = async (action: {
  adminEmail: string;
  action: string;
  details: any;
  timestamp: Date;
}) => {
  try {
    const docRef = await addDoc(collection(db, "adminActions"), action);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAdminActions = async (adminEmail?: string) => {
  try {
    let q;
    if (adminEmail) {
      q = query(
        collection(db, "adminActions"),
        where("adminEmail", "==", adminEmail),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        collection(db, "adminActions"),
        orderBy("timestamp", "desc")
      );
    }
    
    const querySnapshot = await getDocs(q);
    const actions: any[] = [];
    querySnapshot.forEach((doc) => {
      actions.push({ ...doc.data(), id: doc.id });
    });
    return { success: true, actions };
  } catch (error: any) {
    return { success: false, error: error.message, actions: [] };
  }
};

export default app;