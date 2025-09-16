// Built-in Authentication System
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = [
  {
    id: "admin1",
    email: "saidev@gmail.com",
    password: "saidev",
    name: "Admin User",
    role: "admin"
  },
  {
    id: "admin2", 
    email: "superadmin@sih2025.com",
    password: "super123",
    name: "Super Admin",
    role: "superadmin"
  },
  {
    id: "admin3",
    email: "test@admin.com",
    password: "test123",
    name: "Test Admin",
    role: "admin"
  }
];

// Authentication functions
export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find matching credentials
    const admin = ADMIN_CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    );
    
    if (!admin) {
      return { 
        success: false, 
        error: "Invalid email or password" 
      };
    }
    
    // Create user object without password
    const user: User = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };
    
    // Store in localStorage for session management
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    
    // Trigger auth state change for current tab
    setTimeout(() => triggerAuthStateChange(), 0);
    
    return { 
      success: true, 
      user 
    };
  } catch {
    return { 
      success: false, 
      error: "Login failed. Please try again." 
    };
  }
};

export const signOut = async () => {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    
    // Trigger auth state change for current tab
    setTimeout(() => triggerAuthStateChange(), 0);
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (userStr && isAuthenticated === 'true') {
      return JSON.parse(userStr);
    }
    return null;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Auth state change listener (for compatibility with existing code)
let authStateCallbacks: ((user: User | null) => void)[] = [];

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  // Add callback to the list
  authStateCallbacks.push(callback);
  
  // Initial call
  callback(getCurrentUser());
  
  // Listen for storage changes (for multi-tab support)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'currentUser' || e.key === 'isAuthenticated') {
      callback(getCurrentUser());
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    authStateCallbacks = authStateCallbacks.filter(cb => cb !== callback);
    window.removeEventListener('storage', handleStorageChange);
  };
};

// Trigger auth state change (call this when localStorage is updated in same tab)
const triggerAuthStateChange = () => {
  const user = getCurrentUser();
  authStateCallbacks.forEach(callback => callback(user));
};

// Get all admin credentials (for testing/reference)
export const getAllAdminCredentials = () => {
  return ADMIN_CREDENTIALS.map(cred => ({
    email: cred.email,
    password: cred.password,
    name: cred.name,
    role: cred.role
  }));
};