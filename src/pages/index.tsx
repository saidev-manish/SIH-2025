import Link from 'next/link';
import styles from '../styles/auth.module.css';

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeCard}>
        <h1 className={styles.homeTitle}>Admin Portal</h1>
        <p className={styles.homeSubtitle}>
          Welcome to the secure admin authentication system. 
          Manage your administrative tasks with ease and security.
        </p>
        <div className={styles.buttonContainer}>
          <Link href="/admin/login" className={`${styles.navButton} ${styles.loginButton}`}>
            Admin Login
          </Link>
          <Link href="/admin/register" className={`${styles.navButton} ${styles.registerButton}`}>
            Admin Register
          </Link>
        </div>
      </div>
    </div>
  );
}