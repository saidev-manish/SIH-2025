import React, { useState } from 'react';
import styles from '../../styles/messaging.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline';
}

interface MessagingSystemProps {
  users: User[];
  adminConfig?: {
    senderEmail: string;
    senderName: string;
    isConfigured: boolean;
  };
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ users, adminConfig }) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    messageType: 'custom' as 'info' | 'warning' | 'alert' | 'custom',
    priority: 'normal' as 'low' | 'normal' | 'high'
  });
  const [isSending, setIsSending] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Quick message templates
  const messageTemplates = [
    {
      type: 'info' as const,
      subject: 'System Notification',
      message: 'This is an important system notification. Please read carefully and take necessary action if required.'
    },
    {
      type: 'warning' as const,
      subject: 'Safety Warning',
      message: 'Please be aware of safety protocols in your current area. Ensure you follow all guidelines and stay alert.'
    },
    {
      type: 'alert' as const,
      subject: 'Emergency Alert',
      message: 'IMMEDIATE ACTION REQUIRED: This is an emergency alert. Please follow emergency procedures and contact authorities if necessary.'
    },
    {
      type: 'custom' as const,
      subject: 'Custom Message',
      message: 'Write your custom message here...'
    }
  ];

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleTemplateSelect = (template: typeof messageTemplates[0]) => {
    setMessageForm({
      subject: template.subject,
      message: template.message,
      messageType: template.type,
      priority: template.type === 'alert' ? 'high' : template.type === 'warning' ? 'normal' : 'normal'
    });
  };

  const handleSendMessage = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to send the message.');
      return;
    }

    if (!messageForm.subject.trim() || !messageForm.message.trim()) {
      alert('Please fill in both subject and message.');
      return;
    }

    if (!adminConfig?.isConfigured || !adminConfig.senderEmail) {
      alert('Please configure your admin email in Settings before sending messages.');
      return;
    }

    setIsSending(true);

    try {
      const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
      const results = [];

      for (const user of selectedUserData) {
        try {
          const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipientEmail: user.email,
              recipientName: user.name,
              subject: messageForm.subject,
              message: messageForm.message,
              messageType: messageForm.messageType,
              priority: messageForm.priority,
              senderEmail: adminConfig.senderEmail,
              senderName: adminConfig.senderName || 'Admin'
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            results.push({ user: user.name, success: true });
          } else {
            results.push({ user: user.name, success: false, error: result.message });
          }
        } catch (error) {
          results.push({ user: user.name, success: false, error: 'Network error' });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        alert(`✅ Message sent successfully to ${successful} user(s)!${failed > 0 ? `\n❌ Failed to send to ${failed} user(s).` : ''}`);
        
        // Reset form if all successful
        if (failed === 0) {
          setMessageForm({
            subject: '',
            message: '',
            messageType: 'custom',
            priority: 'normal'
          });
          setSelectedUsers([]);
          setShowUserSelector(false);
        }
      } else {
        alert('❌ Failed to send message to all selected users. Please check your email configuration.');
      }

    } catch (error) {
      console.error('Error sending messages:', error);
      alert('❌ Failed to send messages. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendViaEmailClient = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to send the message.');
      return;
    }

    if (!messageForm.subject.trim() || !messageForm.message.trim()) {
      alert('Please fill in both subject and message.');
      return;
    }

    if (!adminConfig?.isConfigured || !adminConfig.senderEmail) {
      alert('Please configure your admin email in Settings before sending messages.');
      return;
    }

    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    
    // Format the email body with proper structure
    const emailBody = `Hello,

${messageForm.message}

---
Message Details:
• Type: ${messageForm.messageType.charAt(0).toUpperCase() + messageForm.messageType.slice(1)}
• Priority: ${messageForm.priority.charAt(0).toUpperCase() + messageForm.priority.slice(1)}
• Sent: ${new Date().toLocaleString()}

Best regards,
${adminConfig.senderName || 'Admin Team'}
${adminConfig.senderEmail}

---
This message was sent from the SIH 2025 Admin Portal`;

    if (selectedUsers.length === 1) {
      // Single recipient - direct mailto
      const recipient = selectedUserData[0];
      const mailtoUrl = `mailto:${recipient.email}?subject=${encodeURIComponent(messageForm.subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_blank');
    } else {
      // Multiple recipients - BCC approach
      const recipients = selectedUserData.map(user => user.email).join(',');
      const mailtoUrl = `mailto:?bcc=${encodeURIComponent(recipients)}&subject=${encodeURIComponent(messageForm.subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_blank');
    }
    
    // Show confirmation with user details
    const userNames = selectedUserData.map(user => user.name).join(', ');
    alert(`✅ Opening email client to send "${messageForm.subject}" to:\n${userNames}`);
    
    // Optional: Reset form after opening email client
    setTimeout(() => {
      const shouldReset = confirm('Email client opened successfully. Would you like to reset the form?');
      if (shouldReset) {
        setMessageForm({
          subject: '',
          message: '',
          messageType: 'custom',
          priority: 'normal'
        });
        setSelectedUsers([]);
      }
    }, 1000);
  };

  return (
    <div className={styles.messagingSystem}>
      <div className={styles.header}>
        <h2>📧 Admin Messaging System</h2>
        <p>Send messages from admin email to user emails</p>
      </div>

      {/* Admin Configuration Status */}
      <div className={styles.adminStatus}>
        {adminConfig?.isConfigured ? (
          <div className={styles.configuredStatus}>
            <span className={styles.statusIcon}>✅</span>
            <div>
              <strong>Message will be sent from:</strong> {adminConfig.senderEmail}
              <br />
              <span className={styles.senderName}>Display Name: {adminConfig.senderName}</span>
            </div>
          </div>
        ) : (
          <div className={styles.notConfiguredStatus}>
            <span className={styles.statusIcon}>⚠️</span>
            <div>
              <strong>Email not configured</strong>
              <br />
              <span>Please go to Settings to configure your admin email</span>
            </div>
          </div>
        )}
      </div>

      {/* Message Type Templates */}
      <div className={styles.templates}>
        <h3>Quick Templates</h3>
        <div className={styles.templateButtons}>
          {messageTemplates.map((template, index) => (
            <button
              key={index}
              onClick={() => handleTemplateSelect(template)}
              className={`${styles.templateBtn} ${styles[template.type]}`}
            >
              {template.type === 'info' && 'ℹ️'} 
              {template.type === 'warning' && '⚠️'} 
              {template.type === 'alert' && '🚨'} 
              {template.type === 'custom' && '📝'} 
              {template.subject}
            </button>
          ))}
        </div>
      </div>

      {/* Message Form */}
      <div className={styles.messageForm}>
        <div className={styles.formGroup}>
          <label>Message Type:</label>
          <select
            title="Select message type"
            value={messageForm.messageType}
            onChange={(e) => setMessageForm(prev => ({ ...prev, messageType: e.target.value as 'custom' | 'info' | 'warning' | 'alert' }))}
            className={styles.select}
          >
            <option value="custom">📝 Custom Message</option>
            <option value="info">ℹ️ Information</option>
            <option value="warning">⚠️ Warning</option>
            <option value="alert">🚨 Alert</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Priority:</label>
          <select
            title="Select message priority"
            value={messageForm.priority}
            onChange={(e) => setMessageForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' }))}
            className={styles.select}
          >
            <option value="low">🔵 Low Priority</option>
            <option value="normal">🟡 Normal Priority</option>
            <option value="high">🔴 High Priority</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Subject:</label>
          <input
            type="text"
            value={messageForm.subject}
            onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter message subject..."
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Message:</label>
          <textarea
            value={messageForm.message}
            onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter your message here..."
            rows={6}
            className={styles.textarea}
          />
        </div>
      </div>

      {/* User Selection */}
      <div className={styles.userSelection}>
        <div className={styles.selectionHeader}>
          <h3>Select Recipients</h3>
          <div className={styles.selectionActions}>
            <button
              onClick={handleSelectAllUsers}
              className={styles.selectAllBtn}
            >
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className={styles.selectedCount}>
              {selectedUsers.length} of {users.length} users selected
            </span>
          </div>
        </div>

        <div className={styles.userGrid}>
          {users.map(user => (
            <div
              key={user.id}
              className={`${styles.userCard} ${selectedUsers.includes(user.id) ? styles.selected : ''}`}
              onClick={() => handleUserSelect(user.id)}
            >
              <div className={styles.userInfo}>
                <div className={`${styles.userStatus} ${styles[user.status]}`}>
                  {user.status === 'online' ? '🟢' : '🔴'}
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userEmail}>{user.email}</div>
                </div>
              </div>
              <div className={styles.selectionIndicator}>
                {selectedUsers.includes(user.id) ? '✅' : '⭕'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Message */}
      <div className={styles.sendSection}>
        <div className={styles.sendButtons}>
          <button
            onClick={handleSendMessage}
            disabled={isSending || selectedUsers.length === 0 || !messageForm.subject.trim() || !messageForm.message.trim()}
            className={`${styles.sendBtn} ${styles.systemSend} ${isSending ? styles.sending : ''}`}
          >
            {isSending ? '📤 Sending...' : `� Send via System to ${selectedUsers.length} User(s)`}
          </button>

          <button
            onClick={handleSendViaEmailClient}
            disabled={selectedUsers.length === 0 || !messageForm.subject.trim() || !messageForm.message.trim() || !adminConfig?.isConfigured}
            className={`${styles.sendBtn} ${styles.emailClientSend}`}
          >
            📧 Open Email Client for {selectedUsers.length} User(s)
          </button>
        </div>
        
        {selectedUsers.length > 0 && adminConfig?.isConfigured && (
          <p className={styles.sendInfo}>
            Message will be sent from <strong>{adminConfig.senderEmail}</strong> to {selectedUsers.length} selected user(s)
          </p>
        )}

        {!adminConfig?.isConfigured && (
          <p className={styles.configWarning}>
            ⚠️ Please configure your admin email in Settings to enable email functionality
          </p>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;