import React from 'react';
import GeofenceManager from '../../components/geofence/GeofenceManager';
import styles from '../../styles/demo.module.css';

const ZoneGeneratorDemo: React.FC = () => {

  return (
    <div className={styles.demoContainer}>
      <div className={styles.demoCard}>
        <h1 className={styles.demoTitle}>
          🎯 Automatic Zone Generator Demo
        </h1>
        
        <div className={styles.instructionBox}>
          <h3 className={styles.instructionTitle}>
            📍 How to Use the Zone Generator
          </h3>
          <ol className={styles.instructionList}>
            <li>Click the <strong>&quot;🎯 Generate Zones&quot;</strong> button in the controls</li>
            <li>Choose from three generation options:
              <ul>
                <li><strong>User Zones:</strong> Create zones around existing users</li>
                <li><strong>City Zones:</strong> Generate zones around major landmarks</li>
                <li><strong>Smart Zones:</strong> Intelligently cluster users for optimized coverage</li>
              </ul>
            </li>
            <li>Select zone type: Safe, Restricted, or No-Drone zones</li>
            <li>Watch as zones are automatically generated based on user locations!</li>
          </ol>
        </div>

        <GeofenceManager />
      </div>
    </div>
  );
};

export default ZoneGeneratorDemo;