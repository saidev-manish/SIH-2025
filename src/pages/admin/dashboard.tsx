import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/dashboard.module.css';
import MessagingSystem from '../../components/messaging/MessagingSystem';
import GeofenceManager from '../../components/geofence/GeofenceManager';
import SecurityMap from '../../components/security/SecurityMap';
import { findNearbySecurityZones } from '../../services/locationService';
import { signOut, onAuthStateChange } from '../../lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'online' | 'offline';
  lastSeen: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ email: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'alerts' | 'geofence' | 'messages' | 'settings' | 'security'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [adminConfig, setAdminConfig] = useState({
    senderEmail: '',
    senderName: '',
    isConfigured: false
  });
  const [selectedSecurityUser, setSelectedSecurityUser] = useState<User | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Mock user data - Email-only communication
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'darkbloodyt140@gmail.com',
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'New Delhi, India'
      },
      status: 'online',
      lastSeen: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: '24e51a67c3@hitam.org',
      location: {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Mumbai, Maharashtra'
      },
      status: 'offline',
      lastSeen: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'lextsphinx@gmail.com',
      location: {
        lat: 17.3850,
        lng: 78.4867,
        address: 'Hyderabad, Telangana'
      },
      status: 'online',
      lastSeen: '1 hour ago'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: 'Bangalore, Karnataka'
      },
      status: 'offline',
      lastSeen: '30 minutes ago'
    },
    {
      id: '5',
      name: 'Robert Wilson',
      email: 'r.wilson@email.com',
      location: {
        lat: 22.5726,
        lng: 88.3639,
        address: 'Kolkata, West Bengal'
      },
      status: 'online',
      lastSeen: 'Just now'
    },
    {
      id: '6',
      name: 'saidev',
      email: 'saidev@gmail.com',
      location: {
        lat: 28.7041,
        lng: 77.1025,
        address: 'Delhi, India'
      },
      status: 'online',
      lastSeen: 'Just now'
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setAdmin({ 
          email: user.email || '', 
          name: user.name || user.email?.split('@')[0] || 'Admin' 
        });
        
        // Auto-populate admin config with login email
        if (!adminConfig.isConfigured && user.email) {
          setAdminConfig(prev => ({
            ...prev,
            senderEmail: user.email || '',
            senderName: user.name || 'Admin Team'
          }));
        }
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router, adminConfig.isConfigured]);

  // Auto-select first user when security tab is opened
  useEffect(() => {
    if (activeTab === 'security' && !selectedSecurityUser && users.length > 0) {
      // Prefer 'saidev' if available, otherwise select first user
      const preferredUser = users.find(user => user.name === 'saidev') || users[0];
      setSelectedSecurityUser(preferredUser);
    }
  }, [activeTab, selectedSecurityUser, users]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSendAlert = async (userId: string, userName: string, userEmail: string) => {
    try {
      const response = await fetch('/api/geofence/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userName,
          userEmail,
          alertType: 'restriction',
          message: 'You are approaching a restricted area. Please change your route immediately.',
          priority: 'high'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Alert sent to ${userName} via email!`);
      } else {
        alert(`Failed to send alert: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert. Please try again.');
    }
  };

  const handleViewOnMap = (user: User) => {
    setSelectedUser(user);
    setShowMap(true);
  };

  const handleSaveAdminConfig = async () => {
    try {
      // Save admin configuration to localStorage or API
      localStorage.setItem('adminConfig', JSON.stringify(adminConfig));
      setAdminConfig({ ...adminConfig, isConfigured: true });
      alert('✅ Admin email configuration saved successfully!');
    } catch (error) {
      console.error('Error saving admin config:', error);
      alert('❌ Failed to save configuration. Please try again.');
    }
  };

  // Load admin configuration on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAdminConfig({ ...config, isConfigured: true });
    }
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!admin) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <nav className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoContainer}>
            <img 
              src="/splash.png" 
              alt="Logo" 
              className={styles.logoImage}
            />
            <h1>Admin Dashboard</h1>
          </div>
          <span className={styles.adminInfo}>Welcome, {admin.name}</span>
        </div>
        <div className={styles.headerRight}>
          <button onClick={handleSignOut} className={styles.signOutBtn}>
            🚪 Sign Out
          </button>
        </div>
      </nav>

      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Navigation</h3>
          </div>
          
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Users (25)
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'alerts' ? styles.active : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              🚨 Alerts
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'geofence' ? styles.active : ''}`}
              onClick={() => setActiveTab('geofence')}
            >
              🗺️ Geofencing
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`}
              onClick={() => setActiveTab('security')}
            >
              🛡️ Security Map
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'messages' ? styles.active : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              💬 Messages
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
          </nav>

          <div className={styles.actionButtons}>
            <button className={styles.sendAlertBtn}>
              🚨 Send Alert
            </button>
            <button className={styles.emergencySOSBtn}>
              🆘 Emergency SOS
            </button>
           
            <button className={styles.emergencyContactBtn}>
              📞 Emergency Contact
            </button>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Online Users</span>
              <span className={styles.statValue}>{users.filter(u => u.status === 'online').length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Users</span>
              <span className={styles.statValue}>{users.length}</span>
            </div>
          </div>
        </aside>

        <main className={styles.mainContent}>
          {activeTab === 'users' && (
            <div className={styles.usersSection}>
              <div className={styles.sectionHeader}>
                <h2>👥 User Management</h2>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th>STATUS</th>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>LOCATION</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.statusIndicator}>
                            <span className={`${styles.statusDot} ${user.status === 'online' ? styles.online : styles.offline}`}></span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.userName}>{user.name}</div>
                        </td>
                        <td>
                          <div className={styles.userEmail}>{user.email}</div>
                        </td>
                        <td>
                          <div className={styles.userLocation}>{user.location.address}</div>
                        </td>
                        <td>
                          <div className={styles.userActions}>
                            <button 
                              className={styles.emailBtn}
                              onClick={() => window.location.href = `mailto:${user.email}`}
                            >
                              📧 Email
                            </button>
                            <button 
                              className={styles.viewMapBtn}
                              onClick={() => handleViewOnMap(user)}
                            >
                              🗺️ View in Map
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className={styles.alertsSection}>
              <h2>🚨 Alert Management</h2>
              <p>Alert management features will be here.</p>
            </div>
          )}

          {activeTab === 'geofence' && (
            <GeofenceManager />
          )}

          {activeTab === 'messages' && (
            <MessagingSystem 
              users={users} 
              adminConfig={adminConfig}
            />
          )}

          {activeTab === 'settings' && (
            <div className={styles.settingsSection}>
              <h2>⚙️ Settings</h2>
              
              <div className={styles.settingsCard}>
                <h3>📧 Email Configuration</h3>
                <p>Configure your admin email settings for sending messages to users.</p>
                
                {admin?.email && !adminConfig.isConfigured && (
                  <div className={styles.autoFillNotice}>
                    💡 We&apos;ve pre-filled your email from your login. You can modify it below and click save.
                  </div>
                )}
                
                <div className={styles.configForm}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="senderEmail">Admin Email Address:</label>
                    <input
                      id="senderEmail"
                      type="email"
                      placeholder="admin@example.com"
                      value={adminConfig.senderEmail}
                      onChange={(e) => setAdminConfig({ 
                        ...adminConfig, 
                        senderEmail: e.target.value 
                      })}
                      className={styles.configInput}
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="senderName">Display Name:</label>
                    <input
                      id="senderName"
                      type="text"
                      placeholder="Admin Team"
                      value={adminConfig.senderName}
                      onChange={(e) => setAdminConfig({ 
                        ...adminConfig, 
                        senderName: e.target.value 
                      })}
                      className={styles.configInput}
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveAdminConfig}
                    className={styles.saveConfigBtn}
                    disabled={!adminConfig.senderEmail || !adminConfig.senderName}
                  >
                    💾 Save Configuration
                  </button>
                  
                  {adminConfig.isConfigured && (
                    <div className={styles.configStatus}>
                      ✅ Email configuration is active
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.settingsCard}>
                <h3>ℹ️ Instructions</h3>
                <ul>
                  <li>Enter your admin email address that will be used as the sender</li>
                  <li>Choose a display name that users will see</li>
                  <li>Make sure your email is properly configured in the system</li>
                  <li>Messages will be sent from: <strong>{adminConfig.senderEmail || 'Not configured'}</strong></li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.securitySection}>
              <h2>🛡️ Security Map</h2>
              <p>Real-time security zone monitoring and alerts for all users</p>
              
              {/* User Selection */}
              <div className={styles.userSelector}>
                <h3>👤 Select User for Security Analysis</h3>
                
                {/* Search Bar */}
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="🔍 Search users by name, email, or location..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className={styles.userSearch}
                  />
                  {userSearchTerm && (
                    <button 
                      className={styles.clearSearch}
                      onClick={() => setUserSearchTerm('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <div className={styles.userGrid}>
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      user.location.address.toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .map((user) => (
                    <div
                      key={user.id}
                      className={`${styles.userCard} ${selectedSecurityUser?.id === user.id ? styles.selected : ''}`}
                      onClick={() => setSelectedSecurityUser(user)}
                    >
                      <div className={styles.userAvatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <h4>{user.name}</h4>
                        <p className={styles.userLocation}>{user.location.address}</p>
                        <div className={styles.userStatus}>
                          <span className={`${styles.statusDot} ${styles[user.status]}`}></span>
                          {user.status} • {user.lastSeen}
                        </div>
                      </div>
                      <div className={styles.selectButton}>
                        {selectedSecurityUser?.id === user.id ? '✓ Selected' : 'Select'}
                      </div>
                    </div>
                  ))}
                  
                  {users.filter(user => 
                    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    user.location.address.toLowerCase().includes(userSearchTerm.toLowerCase())
                  ).length === 0 && userSearchTerm && (
                    <div className={styles.noResults}>
                      <p>🔍 No users found matching &quot;{userSearchTerm}&quot;</p>
                      <button 
                        className={styles.clearSearchBtn}
                        onClick={() => setUserSearchTerm('')}
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Map Display */}
              {selectedSecurityUser ? (
                <div className={styles.securityMapWrapper}>
                  <div className={styles.selectedUserInfo}>
                    <div className={styles.selectedUserHeader}>
                      <div className={styles.selectedUserAvatar}>
                        {selectedSecurityUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3>Security Analysis for {selectedSecurityUser.name}</h3>
                        <p>📍 {selectedSecurityUser.location.address}</p>
                        <p>📧 {selectedSecurityUser.email}</p>
                        <div className={styles.securityStats}>
                          {(() => {
                            const nearbyZones = findNearbySecurityZones(
                              selectedSecurityUser.location.lat, 
                              selectedSecurityUser.location.lng, 
                              10
                            );
                            const criticalZones = nearbyZones.filter(z => z.severity === 'critical').length;
                            const totalZones = nearbyZones.length;
                            
                            return (
                              <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                  <span className={styles.statNumber}>{totalZones}</span>
                                  <span className={styles.statLabel}>Security Zones</span>
                                </div>
                                <div className={styles.statItem}>
                                  <span className={styles.statNumber}>{criticalZones}</span>
                                  <span className={styles.statLabel}>Critical Areas</span>
                                </div>
                                <div className={styles.statItem}>
                                  <span className={styles.statNumber}>{nearbyZones.filter(z => z.type === 'police_station').length}</span>
                                  <span className={styles.statLabel}>Police Stations</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className={styles.userActions}>
                        <div className={styles.userStatusBadge}>
                          <span className={`${styles.statusDot} ${styles[selectedSecurityUser.status]}`}></span>
                          {selectedSecurityUser.status.toUpperCase()}
                        </div>
                        <button 
                          className={styles.changeUserBtn}
                          onClick={() => setSelectedSecurityUser(null)}
                        >
                          🔄 Change User
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <SecurityMap 
                    userLocation={{
                      id: selectedSecurityUser.id,
                      name: selectedSecurityUser.name,
                      coordinates: {
                        lat: selectedSecurityUser.location.lat,
                        lng: selectedSecurityUser.location.lng
                      }
                    }}
                    showControls={true}
                  />
                </div>
              ) : (
                <div className={styles.noSelectionMessage}>
                  <div className={styles.selectionPrompt}>
                    <div className={styles.promptIcon}>🎯</div>
                    <h3>Choose a User to Analyze</h3>
                    <p>Select any user from the list above to view their security zone analysis, nearby police stations, restricted areas, and real-time threat assessment.</p>
                    <div className={styles.featureList}>
                      <div className={styles.feature}>🛡️ Security zone detection</div>
                      <div className={styles.feature}>👮 Nearest police stations</div>
                      <div className={styles.feature}>🚁 No-fly zone alerts</div>
                      <div className={styles.feature}>📡 Radar visualization</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Map Modal */}
      {showMap && selectedUser && (
        <div className={styles.mapModal} onClick={() => setShowMap(false)}>
          <div className={styles.mapContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mapHeader}>
              <h3>🗺️ {selectedUser.name}&apos;s Location</h3>
              <button 
                onClick={() => setShowMap(false)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.mapContent}>
              <div className={styles.userDetails}>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
                <p><strong>Location:</strong> {selectedUser.location.address}</p>
                <p><strong>Coordinates:</strong> {selectedUser.location.lat.toFixed(6)}, {selectedUser.location.lng.toFixed(6)}</p>
                <div className={styles.mapActions}>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedUser.location.lat},${selectedUser.location.lng}`, '_blank')}
                    className={styles.googleMapsBtn}
                  >
                    🗺️ Open in Google Maps
                  </button>
                  <button 
                    onClick={() => handleSendAlert(selectedUser.id, selectedUser.name, selectedUser.email)}
                    className={styles.sendAlertBtn}
                  >
                    🚨 Send Alert
                  </button>
                </div>
              </div>
              <div className={styles.mapFrame}>
                <div className={styles.mapEmbed}>
                  <p>📍 Location: {selectedUser.location.address}</p>
                  <p>📌 Coordinates: {selectedUser.location.lat.toFixed(6)}, {selectedUser.location.lng.toFixed(6)}</p>
                  <div className={styles.mapLinks}>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedUser.location.lat},${selectedUser.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      🗺️ Open in Google Maps
                    </a>
                    <a 
                      href={`https://www.openstreetmap.org/?mlat=${selectedUser.location.lat}&mlon=${selectedUser.location.lng}&zoom=15`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      🌍 Open in OpenStreetMap
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
