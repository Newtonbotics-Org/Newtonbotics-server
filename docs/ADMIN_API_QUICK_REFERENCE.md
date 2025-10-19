# Admin Dashboard API Quick Reference

This document provides a quick reference for implementing the admin dashboard and notification functionality in the frontend.

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/dashboard/summary` | Get dashboard summary data | Admin |
| GET | `/api/admin/dashboard/notifications` | Get notifications | Admin |
| PUT | `/api/admin/dashboard/notifications/:id/read` | Mark notification as read | Admin |
| PUT | `/api/admin/dashboard/notifications/read-all` | Mark all notifications as read | Admin |
| GET | `/api/admin/dashboard/settings` | Get notification settings | Admin |
| PUT | `/api/admin/dashboard/settings` | Update notification settings | Admin |

## Request/Response Examples

### 1. Dashboard Summary

**Request:**
```bash
GET /api/admin/dashboard/summary?period=30d&includeCharts=true
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "dateRange": {
      "start": "2024-09-19T00:00:00.000Z",
      "end": "2024-10-19T00:00:00.000Z"
    },
    "overview": {
      "totalUsers": 150,
      "activeUsers": 145,
      "totalProjects": 25,
      "activeProjects": 18,
      "totalWorkshops": 12,
      "upcomingEvents": 5,
      "totalNews": 8,
      "totalEquipment": 45,
      "pendingRequests": 3,
      "contactSubmissions": 12,
      "newsletterSubscribers": 89,
      "unreadNotifications": 7
    },
    "recentActivity": {
      "newUsers": 5,
      "newProjects": 2,
      "newRequests": 1,
      "newWorkshops": 1,
      "newEvents": 0,
      "newNews": 1,
      "newContacts": 2
    },
    "statusBreakdown": {
      "projects": [
        { "_id": "active", "count": 18 },
        { "_id": "completed", "count": 7 }
      ],
      "requests": [
        { "_id": "pending", "count": 3 },
        { "_id": "approved", "count": 15 },
        { "_id": "rejected", "count": 2 }
      ]
    },
    "charts": {
      "userGrowth": [
        { "_id": { "year": 2024, "month": 10, "day": 15 }, "count": 2 }
      ],
      "projectActivity": [
        { "_id": { "year": 2024, "month": 10, "day": 15 }, "count": 1 }
      ],
      "equipmentUtilization": [
        { "_id": "Electronics", "count": 15, "available": 12 }
      ]
    }
  }
}
```

### 2. Get Notifications

**Request:**
```bash
GET /api/admin/dashboard/notifications?limit=20&skip=0&read=false&priority=high
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "userId": "user_id",
        "title": "System Alert",
        "message": "High CPU usage detected",
        "type": "system_alert",
        "priority": "high",
        "category": "warning",
        "relatedEntity": {
          "type": "system",
          "id": "system_id",
          "title": "System Health"
        },
        "action": {
          "type": "view",
          "url": "/admin/system",
          "label": "View System"
        },
        "delivery": {
          "email": { "sent": true, "sentAt": "2024-10-19T10:00:00.000Z" },
          "push": { "sent": true, "sentAt": "2024-10-19T10:00:00.000Z" },
          "sms": { "sent": false },
          "inApp": { "delivered": true, "deliveredAt": "2024-10-19T10:00:00.000Z" }
        },
        "read": false,
        "readAt": null,
        "archived": false,
        "archivedAt": null,
        "createdAt": "2024-10-19T10:00:00.000Z",
        "updatedAt": "2024-10-19T10:00:00.000Z",
        "timeAgo": "2h ago"
      }
    ],
    "stats": {
      "total": 25,
      "unread": 7,
      "read": 18,
      "byType": [
        { "type": "system_alert", "count": 5 },
        { "type": "project_update", "count": 10 }
      ],
      "byPriority": [
        { "priority": "high", "count": 8 },
        { "priority": "medium", "count": 12 }
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

### 3. Update Notification Settings

**Request:**
```bash
PUT /api/admin/dashboard/settings
Authorization: Bearer <admin_token>
Content-Type: application/json

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

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated",
  "data": {
    "settings": {
      // Updated settings object
    }
  }
}
```

## Data Types and Enums

### Notification Types
- `project_update`
- `project_approval`
- `project_rejection`
- `workshop_update`
- `event_update`
- `news_update`
- `system_alert`
- `role_approval`
- `inventory_alert`
- `contact_submission`
- `security_alert`
- `backup_alert`
- `performance_alert`
- `user_activity`
- `system_health`

### Priority Levels
- `low`
- `medium`
- `high`
- `critical`

### Categories
- `info`
- `success`
- `warning`
- `error`
- `system`

### Time Periods
- `7d` - 7 days
- `30d` - 30 days
- `90d` - 90 days
- `1y` - 1 year
- `all` - All time

## Frontend Implementation Checklist

### Dashboard Implementation
- [ ] Create dashboard layout with responsive grid
- [ ] Implement overview cards with statistics
- [ ] Add charts for user growth, project activity, etc.
- [ ] Create period selector (7d, 30d, 90d, 1y, all)
- [ ] Add real-time updates with auto-refresh
- [ ] Implement error handling and loading states
- [ ] Add accessibility features (ARIA labels, keyboard navigation)

### Notification Implementation
- [ ] Create notification center/drawer component
- [ ] Implement notification list with read/unread states
- [ ] Add notification filtering (type, priority, read status)
- [ ] Create notification item component with actions
- [ ] Implement mark as read functionality
- [ ] Add notification settings panel
- [ ] Create notification badge/counter
- [ ] Add real-time notification updates

### Settings Implementation
- [ ] Create notification settings form
- [ ] Implement email notification toggles
- [ ] Add push notification preferences
- [ ] Create SMS notification settings
- [ ] Implement quiet hours configuration
- [ ] Add admin-specific settings
- [ ] Create settings validation and error handling

### State Management
- [ ] Set up Redux store for dashboard data
- [ ] Create notification state management
- [ ] Implement caching for dashboard data
- [ ] Add optimistic updates for notifications
- [ ] Create error state management

### Performance Optimization
- [ ] Implement lazy loading for dashboard components
- [ ] Add memoization for expensive calculations
- [ ] Use virtual scrolling for large notification lists
- [ ] Implement data pagination
- [ ] Add loading skeletons
- [ ] Optimize chart rendering

### Testing
- [ ] Write unit tests for components
- [ ] Create integration tests for API calls
- [ ] Add accessibility tests
- [ ] Implement error boundary testing
- [ ] Create performance tests

## Common Implementation Patterns

### API Service Pattern
```javascript
// services/apiService.js
class ApiService {
  constructor(baseURL) {
    this.client = axios.create({ baseURL });
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, params = {}) {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post(url, data = {}) {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put(url, data = {}) {
    const response = await this.client.put(url, data);
    return response.data;
  }
}
```

### Custom Hook Pattern
```javascript
// hooks/useDashboard.js
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

export const useDashboard = (period = '30d') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getSummary(period, true);
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchData();

  return { data, loading, error, refresh };
};
```

### Error Handling Pattern
```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error';
      default:
        return data.message || 'An error occurred';
    }
  } else if (error.request) {
    return 'Network error';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};
```

This quick reference provides all the essential information needed to implement the admin dashboard and notification functionality in your frontend admin panel.

