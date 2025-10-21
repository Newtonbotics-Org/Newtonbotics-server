# Admin Dashboard & Notification API Documentation

This document describes the Admin Dashboard and Notification APIs for the NewtonBotics server.

## Table of Contents

1. [Dashboard API](#dashboard-api)
2. [Notification API](#notification-api)
3. [Notification Settings API](#notification-settings-api)
4. [Models](#models)
5. [Services](#services)
6. [Testing](#testing)

## Dashboard API

### Get Dashboard Summary

**Endpoint**: `GET /api/admin/dashboard/summary`

**Description**: Get comprehensive dashboard summary data for admin users.

**Authentication**: Admin token required

**Query Parameters**:

| Parameter | Type | Required | Description | Default | Valid Values |
|-----------|------|----------|-------------|---------|--------------|
| `period` | string | No | Time period for data | `30d` | `7d`, `30d`, `90d`, `1y`, `all` |
| `includeCharts` | boolean | No | Include chart data | `true` | `true`, `false` |

**Response Format**:

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
      ],
      "workshops": [
        { "_id": "scheduled", "count": 8 },
        { "_id": "completed", "count": 4 }
      ],
      "events": [
        { "_id": "upcoming", "count": 5 },
        { "_id": "completed", "count": 10 }
      ],
      "equipment": [
        { "_id": "available", "count": 35 },
        { "_id": "in_use", "count": 10 }
      ]
    },
    "charts": {
      "userGrowth": [
        { "_id": { "year": 2024, "month": 10, "day": 15 }, "count": 2 },
        { "_id": { "year": 2024, "month": 10, "day": 16 }, "count": 1 }
      ],
      "projectActivity": [
        { "_id": { "year": 2024, "month": 10, "day": 15 }, "count": 1 },
        { "_id": { "year": 2024, "month": 10, "day": 16 }, "count": 0 }
      ],
      "requestTrends": [
        { "_id": { "year": 2024, "month": 10, "day": 15 }, "count": 1 },
        { "_id": { "year": 2024, "month": 10, "day": 16 }, "count": 0 }
      ],
      "equipmentUtilization": [
        { "_id": "Electronics", "count": 15, "available": 12 },
        { "_id": "Mechanical", "count": 20, "available": 18 }
      ],
      "notificationTrends": [
        { "_id": { "year": 2024, "month": 10, "day": 15 }, "count": 3 },
        { "_id": { "year": 2024, "month": 10, "day": 16 }, "count": 2 }
      ]
    }
  }
}
```

**Usage Examples**:

```bash
# Get 30-day summary
curl -X GET "http://localhost:3005/api/admin/dashboard/summary" \
  -H "Authorization: Bearer <admin_token>"

# Get 7-day summary with charts
curl -X GET "http://localhost:3005/api/admin/dashboard/summary?period=7d&includeCharts=true" \
  -H "Authorization: Bearer <admin_token>"

# Get yearly summary without charts
curl -X GET "http://localhost:3005/api/admin/dashboard/summary?period=1y&includeCharts=false" \
  -H "Authorization: Bearer <admin_token>"
```

## Notification API

### Get Notifications

**Endpoint**: `GET /api/admin/dashboard/notifications`

**Description**: Get admin notifications with filtering and pagination.

**Authentication**: Admin token required

**Query Parameters**:

| Parameter | Type | Required | Description | Default | Valid Values |
|-----------|------|----------|-------------|---------|--------------|
| `limit` | integer | No | Items per page | 20 | 1-100 |
| `skip` | integer | No | Items to skip | 0 | ≥0 |
| `type` | string | No | Filter by type | - | See notification types |
| `priority` | string | No | Filter by priority | - | `low`, `medium`, `high`, `critical` |
| `read` | boolean | No | Filter by read status | - | `true`, `false` |

**Response Format**:

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
        { "type": "project_update", "count": 10 },
        { "type": "contact_submission", "count": 3 }
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

### Mark Notification as Read

**Endpoint**: `PUT /api/admin/dashboard/notifications/:id/read`

**Description**: Mark a specific notification as read.

**Authentication**: Admin token required

**Response Format**:

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "_id": "notification_id",
      "read": true,
      "readAt": "2024-10-19T10:30:00.000Z"
    }
  }
}
```

### Mark All Notifications as Read

**Endpoint**: `PUT /api/admin/dashboard/notifications/read-all`

**Description**: Mark all unread notifications as read.

**Authentication**: Admin token required

**Response Format**:

```json
{
  "success": true,
  "message": "5 notifications marked as read",
  "data": {
    "modifiedCount": 5
  }
}
```

## Notification Settings API

### Get Notification Settings

**Endpoint**: `GET /api/admin/dashboard/settings`

**Description**: Get admin notification settings.

**Authentication**: Admin token required

**Response Format**:

```json
{
  "success": true,
  "data": {
    "settings": {
      "_id": "settings_id",
      "userId": "user_id",
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

### Update Notification Settings

**Endpoint**: `PUT /api/admin/dashboard/settings`

**Description**: Update admin notification settings.

**Authentication**: Admin token required

**Request Body**:

```json
{
  "email": {
    "enabled": true,
    "projectUpdates": true,
    "systemAlerts": true
  },
  "push": {
    "enabled": true,
    "projectUpdates": true,
    "systemAlerts": true
  },
  "sms": {
    "enabled": false,
    "emergencyAlerts": true
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00"
  }
}
```

**Response Format**:

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

## Models

### NotificationSettings Model

**Fields**:
- `userId`: Reference to User model
- `email`: Email notification preferences
- `push`: Push notification preferences
- `sms`: SMS notification preferences
- `inApp`: In-app notification preferences
- `frequency`: Notification frequency settings
- `quietHours`: Quiet hours configuration
- `adminSettings`: Admin-specific settings

### Notification Model

**Fields**:
- `userId`: Reference to User model
- `title`: Notification title
- `message`: Notification message
- `type`: Notification type (enum)
- `priority`: Priority level (enum)
- `category`: Notification category (enum)
- `relatedEntity`: Related entity information
- `action`: Action information
- `delivery`: Delivery status for each channel
- `read`: Read status
- `archived`: Archive status
- `expiresAt`: Expiration date
- `metadata`: Additional metadata

**Notification Types**:
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

## Services

### NotificationService

The `NotificationService` provides methods for creating and sending notifications:

**Key Methods**:
- `createAndSendNotification(data)`: Create and send a single notification
- `sendBulkNotification(data)`: Send notification to multiple users
- `sendNotificationToRole(data)`: Send notification to users by role
- `sendAdminNotification(data)`: Send notification to all admins
- `notifyProjectUpdate(project, action, userId)`: Notify project updates
- `notifyProjectApproval(projectRequest, userId)`: Notify project approval
- `notifyProjectRejection(projectRequest, userId, reason)`: Notify project rejection
- `notifySystemAlert(title, message, priority)`: Send system alert
- `notifySecurityAlert(title, message)`: Send security alert
- `notifyContactSubmission(contactSubmission)`: Notify new contact submission

## Testing

### Test Script

Use the provided test script to verify all functionality:

```bash
# Set your admin token
export ADMIN_TOKEN="your_admin_jwt_token"

# Run the test
node scripts/testAdminDashboardAPI.js
```

### Manual Testing

```bash
# Get dashboard summary
curl -X GET "http://localhost:3005/api/admin/dashboard/summary" \
  -H "Authorization: Bearer <admin_token>"

# Get notifications
curl -X GET "http://localhost:3005/api/admin/dashboard/notifications" \
  -H "Authorization: Bearer <admin_token>"

# Get notification settings
curl -X GET "http://localhost:3005/api/admin/dashboard/settings" \
  -H "Authorization: Bearer <admin_token>"

# Update notification settings
curl -X PUT "http://localhost:3005/api/admin/dashboard/settings" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":{"enabled":true,"systemAlerts":true}}'
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "message": "Detailed error message",
    "stack": "Error stack trace",
    "details": {
      "statusCode": 400,
      "isOperational": true
    }
  },
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/summary",
  "method": "GET"
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid admin tokens
2. **Authorization**: Only admin users can access these endpoints
3. **Rate Limiting**: Standard rate limiting applies
4. **Input Validation**: All inputs are validated using express-validator
5. **Data Sanitization**: All data is sanitized before processing

## Performance Considerations

1. **Database Indexes**: Proper indexes are created for optimal query performance
2. **Pagination**: All list endpoints support pagination
3. **Caching**: Consider implementing Redis caching for dashboard data
4. **Aggregation**: Uses MongoDB aggregation for efficient data processing
5. **Background Processing**: Notification sending can be moved to background jobs


