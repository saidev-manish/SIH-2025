import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {  
  signOutAdmin, 
  auth,
  saveAdminAction 
} from '../../lib/firebase';
import { User } from 'firebase/auth';
import styles from '../../styles/auth.module.css';

interface FirebaseAuthProps {
  onAuthSuccess: (user: User) => void;
}

const FirebaseAuth: React.FC<FirebaseAuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        onAuthSuccess(user);
      }
    });

    return () => unsubscribe();
  }, [onAuthSuccess]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if email is in allowed admin list
    const allowedAdmins = [
      'admin@example.com',
      'saidevmanish@gmail.com',
      'superadmin@company.com',
      'john.doe@admin.com',
      'manager@portal.com',
      'test@admin.local',
      'demo@dashboard.com'
    ];

    if (!allowedAdmins.includes(email)) {
      setError('Access denied. Only authorized admin emails are allowed.');
      setLoading(false);
      return;
    }

  
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (user) {
        await saveAdminAction({
          adminEmail: user.email || '',
          action: 'LOGOUT',
          details: { timestamp: new Date() },
          timestamp: new Date()
        });
      }
      
      await signOutAdmin();
      router.push('/admin/login');
    } catch (error: any) {
      setError(error.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            Welcome, {user.email}
          </h2>
          <p className={styles.subtitle}>
            You are successfully authenticated
          </p>
          <button 
            onClick={handleSignOut}
            disabled={loading}
            className={`${styles.button} ${loading ? styles.loading : ''}`}
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <h1 className={styles.formTitle}>🛡️ Admin Portal</h1>
          <p className={styles.subtitle}>Sign in with your authorized email</p>
        </div>

        <form onSubmit={handleSignIn} className={styles.form}>
          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your admin email"
              className={`${styles.input} ${loading ? styles.disabled : ''}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
              className={`${styles.input} ${loading ? styles.disabled : ''}`}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`${styles.button} ${loading ? styles.loading : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.secureText}>🔒 Secure Firebase Authentication</p>
          <p className={styles.helpText}>Only authorized admin emails can access this portal</p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuth;