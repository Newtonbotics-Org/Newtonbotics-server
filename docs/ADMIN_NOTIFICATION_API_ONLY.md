# Admin Notification API Endpoints

This document provides the API endpoints specifically for the admin notification functionality.

## Base URL
```
http://localhost:3005/api/admin/dashboard
```

## Authentication
All endpoints require admin authentication:
```
Authorization: Bearer <admin_jwt_token>
```

---

## 1. Get Notifications

**Endpoint:** `GET /api/admin/dashboard/notifications`

**Description:** Get admin notifications with filtering, pagination, and statistics.

### Query Parameters

| Parameter | Type | Required | Default | Description | Valid Values |
|-----------|------|----------|---------|-------------|--------------|
| `limit` | integer | No | `20` | Items per page | 1-100 |
| `skip` | integer | No | `0` | Items to skip | ≥0 |
| `type` | string | No | - | Filter by notification type | See notification types below |
| `priority` | string | No | - | Filter by priority | `low`, `medium`, `high`, `critical` |
| `read` | boolean | No | - | Filter by read status | `true`, `false` |

### Request Example
```bash
curl -X GET "http://localhost:3005/api/admin/dashboard/notifications?limit=20&skip=0&read=false&priority=high" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "68f2db7b640a945ff91190df",
        "userId": "68a30681af3f3b7d9e2653a3",
        "title": "System Alert",
        "message": "High CPU usage detected on server",
        "type": "system_alert",
        "priority": "high",
        "category": "warning",
        "relatedEntity": {
          "type": "system",
          "id": "server_001",
          "title": "Main Server"
        },
        "action": {
          "type": "view",
          "url": "/admin/system/server_001",
          "label": "View Server"
        },
        "delivery": {
          "email": {
            "sent": true,
            "sentAt": "2024-10-19T10:00:00.000Z",
            "error": null
          },
          "push": {
            "sent": true,
            "sentAt": "2024-10-19T10:00:00.000Z",
            "error": null
          },
          "sms": {
            "sent": false,
            "sentAt": null,
            "error": "SMS service not configured"
          },
          "inApp": {
            "delivered": true,
            "deliveredAt": "2024-10-19T10:00:00.000Z"
          }
        },
        "read": false,
        "readAt": null,
        "archived": false,
        "archivedAt": null,
        "expiresAt": "2024-10-26T10:00:00.000Z",
        "metadata": {
          "serverId": "server_001",
          "cpuUsage": 95,
          "threshold": 90
        },
        "createdAt": "2024-10-19T10:00:00.000Z",
        "updatedAt": "2024-10-19T10:00:00.000Z",
        "timeAgo": "2h ago"
      },
      {
        "_id": "68f2db7b640a945ff91190e0",
        "userId": "68a30681af3f3b7d9e2653a3",
        "title": "New Contact Submission",
        "message": "New contact form submission from John Doe",
        "type": "contact_submission",
        "priority": "medium",
        "category": "info",
        "relatedEntity": {
          "type": "contact",
          "id": "contact_123",
          "title": "Partnership Inquiry"
        },
        "action": {
          "type": "view",
          "url": "/admin/contacts/contact_123",
          "label": "View Submission"
        },
        "delivery": {
          "email": {
            "sent": true,
            "sentAt": "2024-10-19T09:30:00.000Z",
            "error": null
          },
          "push": {
            "sent": true,
            "sentAt": "2024-10-19T09:30:00.000Z",
            "error": null
          },
          "sms": {
            "sent": false,
            "sentAt": null,
            "error": null
          },
          "inApp": {
            "delivered": true,
            "deliveredAt": "2024-10-19T09:30:00.000Z"
          }
        },
        "read": true,
        "readAt": "2024-10-19T09:45:00.000Z",
        "archived": false,
        "archivedAt": null,
        "expiresAt": "2024-10-26T09:30:00.000Z",
        "metadata": {
          "contactId": "contact_123",
          "submissionType": "partnership"
        },
        "createdAt": "2024-10-19T09:30:00.000Z",
        "updatedAt": "2024-10-19T09:45:00.000Z",
        "timeAgo": "3h ago"
      }
    ],
    "stats": {
      "total": 25,
      "unread": 7,
      "read": 18,
      "byType": [
        { "type": "system_alert", "count": 5 },
        { "type": "contact_submission", "count": 8 },
        { "type": "project_update", "count": 6 },
        { "type": "security_alert", "count": 3 },
        { "type": "user_activity", "count": 3 }
      ],
      "byPriority": [
        { "priority": "high", "count": 8 },
        { "priority": "medium", "count": 12 },
        { "priority": "low", "count": 5 }
      ]
    },
    "pagination": {
      "limit": 20,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

## 2. Mark Notification as Read

**Endpoint:** `PUT /api/admin/dashboard/notifications/:id/read`

**Description:** Mark a specific notification as read.

### Path Parameters
- `id` (string, required): Notification ID

### Request Example
```bash
curl -X PUT "http://localhost:3005/api/admin/dashboard/notifications/68f2db7b640a945ff91190df/read" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "_id": "68f2db7b640a945ff91190df",
      "read": true,
      "readAt": "2024-10-19T12:00:00.000Z"
    }
  }
}
```

---

## 3. Mark All Notifications as Read

**Endpoint:** `PUT /api/admin/dashboard/notifications/read-all`

**Description:** Mark all unread notifications as read.

### Request Example
```bash
curl -X PUT "http://localhost:3005/api/admin/dashboard/notifications/read-all" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### Response Example
```json
{
  "success": true,
  "message": "5 notifications marked as read",
  "data": {
    "modifiedCount": 5
  }
}
```

---

## 4. Get Notification Settings

**Endpoint:** `GET /api/admin/dashboard/settings`

**Description:** Get admin notification settings and preferences.

### Request Example
```bash
curl -X GET "http://localhost:3005/api/admin/dashboard/settings" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "settings": {
      "_id": "68f2db7b640a945ff91190e1",
      "userId": "68a30681af3f3b7d9e2653a3",
      "email": {
        "enabled": true,
        "projectUpdates": true,
        "projectApprovals": true,
        "projectRejections": true,
        "workshopUpdates": true,
        "eventUpdates": true,
        "newsUpdates": true,
        "systemAlerts": true,
        "weeklyDigest": true,
        "roleApprovals": true,
        "inventoryAlerts": true,
        "contactSubmissions": true
      },
      "push": {
        "enabled": true,
        "projectUpdates": true,
        "projectApprovals": true,
        "projectRejections": true,
        "workshopUpdates": true,
        "eventUpdates": true,
        "newsUpdates": true,
        "systemAlerts": true,
        "roleApprovals": true,
        "inventoryAlerts": true,
        "contactSubmissions": true
      },
      "sms": {
        "enabled": false,
        "projectApprovals": false,
        "projectRejections": false,
        "systemAlerts": false,
        "emergencyAlerts": true
      },
      "inApp": {
        "enabled": true,
        "projectUpdates": true,
        "projectApprovals": true,
        "projectRejections": true,
        "workshopUpdates": true,
        "eventUpdates": true,
        "newsUpdates": true,
        "systemAlerts": true,
        "roleApprovals": true,
        "inventoryAlerts": true,
        "contactSubmissions": true
      },
      "frequency": {
        "immediate": true,
        "daily": false,
        "weekly": false,
        "monthly": false
      },
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "UTC"
      },
      "adminSettings": {
        "criticalAlerts": true,
        "systemHealth": true,
        "userActivity": true,
        "securityAlerts": true,
        "backupAlerts": true,
        "performanceAlerts": true
      },
      "createdAt": "2024-10-19T00:00:00.000Z",
      "updatedAt": "2024-10-19T10:00:00.000Z"
    }
  }
}
```

---

## 5. Update Notification Settings

**Endpoint:** `PUT /api/admin/dashboard/settings`

**Description:** Update admin notification settings and preferences.

### Request Body
```json
{
  "email": {
    "enabled": true,
    "projectUpdates": true,
    "projectApprovals": true,
    "projectRejections": true,
    "workshopUpdates": true,
    "eventUpdates": true,
    "newsUpdates": true,
    "systemAlerts": true,
    "weeklyDigest": true,
    "roleApprovals": true,
    "inventoryAlerts": true,
    "contactSubmissions": true
  },
  "push": {
    "enabled": true,
    "projectUpdates": true,
    "projectApprovals": true,
    "projectRejections": true,
    "workshopUpdates": true,
    "eventUpdates": true,
    "newsUpdates": true,
    "systemAlerts": true,
    "roleApprovals": true,
    "inventoryAlerts": true,
    "contactSubmissions": true
  },
  "sms": {
    "enabled": false,
    "projectApprovals": false,
    "projectRejections": false,
    "systemAlerts": false,
    "emergencyAlerts": true
  },
  "inApp": {
    "enabled": true,
    "projectUpdates": true,
    "projectApprovals": true,
    "projectRejections": true,
    "workshopUpdates": true,
    "eventUpdates": true,
    "newsUpdates": true,
    "systemAlerts": true,
    "roleApprovals": true,
    "inventoryAlerts": true,
    "contactSubmissions": true
  },
  "frequency": {
    "immediate": true,
    "daily": false,
    "weekly": false,
    "monthly": false
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "UTC"
  },
  "adminSettings": {
    "criticalAlerts": true,
    "systemHealth": true,
    "userActivity": true,
    "securityAlerts": true,
    "backupAlerts": true,
    "performanceAlerts": true
  }
}
```

### Request Example
```bash
curl -X PUT "http://localhost:3005/api/admin/dashboard/settings" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": {
      "enabled": true,
      "systemAlerts": true,
      "contactSubmissions": true
    },
    "push": {
      "enabled": true,
      "systemAlerts": true
    },
    "quietHours": {
      "enabled": true,
      "startTime": "22:00",
      "endTime": "08:00"
    }
  }'
```

### Response Example
```json
{
  "success": true,
  "message": "Notification settings updated",
  "data": {
    "settings": {
      "_id": "68f2db7b640a945ff91190e1",
      "userId": "68a30681af3f3b7d9e2653a3",
      "email": {
        "enabled": true,
        "systemAlerts": true,
        "contactSubmissions": true
      },
      "push": {
        "enabled": true,
        "systemAlerts": true
      },
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "UTC"
      },
      "updatedAt": "2024-10-19T12:00:00.000Z"
    }
  }
}
```

---

## Notification Types

| Type | Description |
|------|-------------|
| `project_update` | Project status or content updates |
| `project_approval` | Project request approved |
| `project_rejection` | Project request rejected |
| `workshop_update` | Workshop schedule or content updates |
| `event_update` | Event schedule or content updates |
| `news_update` | News article published or updated |
| `system_alert` | System health or performance alerts |
| `role_approval` | User role approval requests |
| `inventory_alert` | Equipment or inventory alerts |
| `contact_submission` | New contact form submissions |
| `security_alert` | Security-related notifications |
| `backup_alert` | Backup process notifications |
| `performance_alert` | Performance monitoring alerts |
| `user_activity` | User activity notifications |
| `system_health` | System health monitoring |

---

## Priority Levels

| Priority | Description | Color |
|----------|-------------|-------|
| `low` | Low priority notifications | Green |
| `medium` | Normal priority notifications | Blue |
| `high` | High priority notifications | Orange |
| `critical` | Critical notifications | Red |

---

## Categories

| Category | Description | Icon |
|----------|-------------|------|
| `info` | Informational notifications | Info circle |
| `success` | Success notifications | Check circle |
| `warning` | Warning notifications | Exclamation circle |
| `error` | Error notifications | Close circle |
| `system` | System notifications | Setting |

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Admin privileges required",
    "details": {
      "statusCode": 401,
      "isOperational": true
    }
  },
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/notifications",
  "method": "GET"
}
```

### 404 Not Found (Notification)
```json
{
  "success": false,
  "message": "Notification not found",
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/notifications/invalid_id/read",
  "method": "PUT"
}
```

### 403 Forbidden (Access Denied)
```json
{
  "success": false,
  "message": "Access denied",
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/notifications/68f2db7b640a945ff91190df/read",
  "method": "PUT"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "limit",
        "message": "limit must be between 1 and 100"
      }
    ]
  },
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/notifications",
  "method": "GET"
}
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
// Get notifications
const getNotifications = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/admin/dashboard/notifications?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`/api/admin/dashboard/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Update notification settings
const updateSettings = async (settings) => {
  try {
    const response = await fetch('/api/admin/dashboard/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Usage examples
const notifications = await getNotifications({ limit: 10, read: false });
const result = await markAsRead('68f2db7b640a945ff91190df');
const settings = await updateSettings({
  email: { enabled: true, systemAlerts: true },
  push: { enabled: true, systemAlerts: true }
});
```

### Axios
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3005/api',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Notification service
const notificationService = {
  // Get notifications
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/admin/dashboard/notifications', {
      params: {
        limit: 20,
        skip: 0,
        ...params
      }
    });
    return response.data.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/admin/dashboard/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/admin/dashboard/notifications/read-all');
    return response.data;
  },

  // Get notification settings
  getSettings: async () => {
    const response = await apiClient.get('/admin/dashboard/settings');
    return response.data.data;
  },

  // Update notification settings
  updateSettings: async (settings) => {
    const response = await apiClient.put('/admin/dashboard/settings', settings);
    return response.data;
  }
};

// Usage
const notifications = await notificationService.getNotifications({ read: false });
const result = await notificationService.markAsRead('68f2db7b640a945ff91190df');
const settings = await notificationService.getSettings();
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useNotifications = (params = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/dashboard/notifications?${new URLSearchParams(params).toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setNotifications(result.data.notifications);
        setStats(result.data.stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [params]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/admin/dashboard/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return { notifications, stats, loading, error, markAsRead };
};

// Usage in component
const NotificationCenter = () => {
  const { notifications, stats, loading, error, markAsRead } = useNotifications({ read: false });

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Notifications ({stats.unread} unread)</h2>
      {notifications.map(notification => (
        <div key={notification._id} className={notification.read ? 'read' : 'unread'}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          {!notification.read && (
            <button onClick={() => markAsRead(notification._id)}>
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## Real-time Updates

For real-time notification updates, you can use WebSocket or Server-Sent Events:

### WebSocket Example
```javascript
const ws = new WebSocket('ws://localhost:3005');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    // Add new notification to the list
    setNotifications(prev => [data.notification, ...prev]);
    setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
  }
};
```

---

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code when limit exceeded

## Caching Recommendations
- **Notifications**: Cache for 1-2 minutes
- **Settings**: Cache for 5-10 minutes
- **Real-time Updates**: Use WebSocket for live updates

This API provides complete notification management functionality for the admin panel, including reading, marking as read, and managing notification preferences.

