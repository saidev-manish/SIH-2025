import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../../styles/dashboard.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastLogin: string;
  orders: number;
  totalSpent: number;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([
    {
      id: 'USR-001',
      name: 'Alice Cooper',
      email: 'alice.cooper@email.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-12-10',
      orders: 12,
      totalSpent: 1450.99
    },
    {
      id: 'USR-002',
      name: 'John Mitchell',
      email: 'john.mitchell@email.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-02-20',
      lastLogin: '2024-12-09',
      orders: 8,
      totalSpent: 890.50
    },
    {
      id: 'USR-003',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      role: 'moderator',
      status: 'active',
      joinDate: '2024-01-10',
      lastLogin: '2024-12-10',
      orders: 15,
      totalSpent: 2100.75
    },
    {
      id: 'USR-004',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      role: 'user',
      status: 'inactive',
      joinDate: '2024-03-05',
      lastLogin: '2024-11-28',
      orders: 3,
      totalSpent: 245.30
    },
    {
      id: 'USR-005',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-04-12',
      lastLogin: '2024-12-09',
      orders: 7,
      totalSpent: 675.99
    },
    {
      id: 'USR-006',
      name: 'Robert Wilson',
      email: 'r.wilson@email.com',
      role: 'user',
      status: 'suspended',
      joinDate: '2024-05-08',
      lastLogin: '2024-11-15',
      orders: 2,
      totalSpent: 89.99
    },
    {
      id: 'USR-007',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@email.com',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-12-10',
      orders: 25,
      totalSpent: 3200.45
    },
    {
      id: 'USR-008',
      name: 'David Brown',
      email: 'david.brown@email.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-06-20',
      lastLogin: '2024-12-08',
      orders: 5,
      totalSpent: 399.99
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    );
  };

  const getTotalUsers = () => users.length;
  const getActiveUsers = () => users.filter(user => user.status === 'active').length;
  const getTotalRevenue = () => users.reduce((sum, user) => sum + user.totalSpent, 0);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mainContentNoSidebar}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Users Management</h1>
            <span className={styles.breadcrumb}>
              <Link href="/admin/dashboard">Dashboard</Link> / Users
            </span>
          </div>
          <div className={styles.headerRight}>
            <Link href="/admin/dashboard" className={styles.cardAction}>
              ← Back to Dashboard
            </Link>
          </div>
        </header>
        
        <div className={styles.dashboardContent}>
          {/* User Stats */}
          <div className={styles.miniStatsGrid}>
            <div className={styles.miniStatCard}>
              <span className={styles.miniStatNumber}>{getTotalUsers()}</span>
              <span className={styles.miniStatLabel}>Total Users</span>
            </div>
            <div className={styles.miniStatCard}>
              <span className={styles.miniStatNumber}>{getActiveUsers()}</span>
              <span className={styles.miniStatLabel}>Active Users</span>
            </div>
            <div className={styles.miniStatCard}>
              <span className={styles.miniStatNumber}>${getTotalRevenue().toLocaleString()}</span>
              <span className={styles.miniStatLabel}>Total Revenue</span>
            </div>
            <div className={styles.miniStatCard}>
              <span className={styles.miniStatNumber}>{selectedUsers.length}</span>
              <span className={styles.miniStatLabel}>Selected</span>
            </div>
          </div>

          {/* Filters and Search */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>User Filters</h3>
              <div className={styles.userActions}>
                <button className={styles.cardAction}>Export Users</button>
                <button className={styles.cardAction}>Add New User</button>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.filtersContainer}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className={styles.filterSelect}
                    title="Filter by role"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={styles.filterSelect}
                    title="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                Users List ({filteredUsers.length} users)
              </h3>
              <div className={styles.bulkActions}>
                {selectedUsers.length > 0 && (
                  <>
                    <button className={styles.bulkActionBtn}>Send Email</button>
                    <button className={styles.bulkActionBtn}>Suspend</button>
                    <button className={styles.bulkActionBtn}>Delete</button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={handleSelectAll}
                          className={styles.checkbox}
                          title="Select all users"
                          aria-label="Select all users"
                        />
                      </th>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Last Login</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={selectedUsers.includes(user.id) ? styles.selectedRow : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className={styles.checkbox}
                            title={`Select user ${user.name}`}
                            aria-label={`Select user ${user.name}`}
                          />
                        </td>
                        <td>{user.id}</td>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`${styles.roleBadge} ${styles[`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`]}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.status} ${styles[`status${user.status.charAt(0).toUpperCase() + user.status.slice(1)}`]}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                        <td>{new Date(user.lastLogin).toLocaleDateString()}</td>
                        <td>{user.orders}</td>
                        <td>${user.totalSpent.toFixed(2)}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button className={styles.actionButton} title={`View user ${user.name}`}>
                              View
                            </button>
                            <button className={styles.actionButton} title={`Edit user ${user.name}`}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}