import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signInWithEmailPassword, onAuthStateChange, getAllAdminCredentials } from '../../lib/auth';
import styles from '../../styles/auth.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        router.push('/admin/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const result = await signInWithEmailPassword(email, password);
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        // Redirect directly after successful login
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1000);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error: unknown) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testCredentials = getAllAdminCredentials();

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>Admin Login</h2>
        <p className={styles.subtitle}>Enter your email and password to access the admin portal</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={styles.input}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={styles.input}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.loading}></span>
                <span className={styles.loadingText}>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        
        {/* Test Credentials Section */}
        <div className={styles.testSection}>
          <button 
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className={styles.testButton}
          >
            {showCredentials ? 'Hide' : 'Show'} Test Credentials
          </button>
          
          {showCredentials && (
            <div className={styles.credentialsList}>
              <h4>Available Test Accounts:</h4>
              {testCredentials.map((cred, index) => (
                <div key={index} className={styles.credentialItem}>
                  <strong>{cred.name} ({cred.role})</strong><br />
                  Email: {cred.email}<br />
                  Password: {cred.password}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.backLinkContainer}>
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
