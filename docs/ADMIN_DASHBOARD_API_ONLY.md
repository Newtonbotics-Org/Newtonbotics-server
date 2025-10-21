# Admin Dashboard API Endpoints

This document provides the API endpoints specifically for the admin dashboard functionality.

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

## 1. Get Dashboard Summary

**Endpoint:** `GET /api/admin/dashboard/summary`

**Description:** Get comprehensive dashboard summary data including statistics, charts, and recent activity.

### Query Parameters

| Parameter | Type | Required | Default | Description | Valid Values |
|-----------|------|----------|---------|-------------|--------------|
| `period` | string | No | `30d` | Time period for data | `7d`, `30d`, `90d`, `1y`, `all` |
| `includeCharts` | boolean | No | `true` | Include chart data | `true`, `false` |

### Request Example
```bash
curl -X GET "http://localhost:3005/api/admin/dashboard/summary?period=30d&includeCharts=true" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Example
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

### Response Fields Description

#### Overview Object
- `totalUsers`: Total number of registered users
- `activeUsers`: Number of active users
- `totalProjects`: Total number of projects
- `activeProjects`: Number of currently active projects
- `totalWorkshops`: Total number of workshops
- `upcomingEvents`: Number of upcoming events
- `totalNews`: Total number of news articles
- `totalEquipment`: Total number of equipment items
- `pendingRequests`: Number of pending project requests
- `contactSubmissions`: Number of contact form submissions
- `newsletterSubscribers`: Number of newsletter subscribers
- `unreadNotifications`: Number of unread notifications

#### Recent Activity Object
- `newUsers`: New users in the selected period
- `newProjects`: New projects in the selected period
- `newRequests`: New requests in the selected period
- `newWorkshops`: New workshops in the selected period
- `newEvents`: New events in the selected period
- `newNews`: New news articles in the selected period
- `newContacts`: New contact submissions in the selected period

#### Status Breakdown Object
Contains arrays of status counts for different entities:
- `projects`: Project status distribution
- `requests`: Request status distribution
- `workshops`: Workshop status distribution
- `events`: Event status distribution
- `equipment`: Equipment status distribution

#### Charts Object (when includeCharts=true)
- `userGrowth`: Daily user registration data
- `projectActivity`: Daily project creation data
- `requestTrends`: Daily project request data
- `equipmentUtilization`: Equipment usage by category
- `notificationTrends`: Daily notification data

---

## 2. Get User Statistics Only

**Endpoint:** `GET /api/admin/dashboard/summary`

**Description:** Get only user statistics without charts.

### Request Example
```bash
curl -X GET "http://localhost:3005/api/admin/dashboard/summary?period=7d&includeCharts=false" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "dateRange": {
      "start": "2024-10-12T00:00:00.000Z",
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
      "newUsers": 2,
      "newProjects": 1,
      "newRequests": 0,
      "newWorkshops": 0,
      "newEvents": 0,
      "newNews": 0,
      "newContacts": 1
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
    }
  }
}
```

---

## 3. Get Chart Data Only

**Endpoint:** `GET /api/admin/dashboard/summary`

**Description:** Get only chart data for specific visualizations.

### Request Example
```bash
curl -X GET "http://localhost:3005/api/admin/dashboard/summary?period=90d&includeCharts=true" \
  -H "Authorization: Bearer <admin_token>"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "period": "90d",
    "dateRange": {
      "start": "2024-07-21T00:00:00.000Z",
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
      "newUsers": 15,
      "newProjects": 8,
      "newRequests": 5,
      "newWorkshops": 3,
      "newEvents": 2,
      "newNews": 4,
      "newContacts": 8
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
        { "_id": { "year": 2024, "month": 8, "day": 1 }, "count": 3 },
        { "_id": { "year": 2024, "month": 8, "day": 2 }, "count": 1 },
        { "_id": { "year": 2024, "month": 8, "day": 3 }, "count": 2 }
      ],
      "projectActivity": [
        { "_id": { "year": 2024, "month": 8, "day": 1 }, "count": 1 },
        { "_id": { "year": 2024, "month": 8, "day": 2 }, "count": 0 },
        { "_id": { "year": 2024, "month": 8, "day": 3 }, "count": 1 }
      ],
      "requestTrends": [
        { "_id": { "year": 2024, "month": 8, "day": 1 }, "count": 1 },
        { "_id": { "year": 2024, "month": 8, "day": 2 }, "count": 0 },
        { "_id": { "year": 2024, "month": 8, "day": 3 }, "count": 0 }
      ],
      "equipmentUtilization": [
        { "_id": "Electronics", "count": 15, "available": 12 },
        { "_id": "Mechanical", "count": 20, "available": 18 },
        { "_id": "Software", "count": 10, "available": 8 }
      ],
      "notificationTrends": [
        { "_id": { "year": 2024, "month": 8, "day": 1 }, "count": 5 },
        { "_id": { "year": 2024, "month": 8, "day": 2 }, "count": 3 },
        { "_id": { "year": 2024, "month": 8, "day": 3 }, "count": 4 }
      ]
    }
  }
}
```

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
  "path": "/api/admin/dashboard/summary",
  "method": "GET"
}
```

### 400 Bad Request (Invalid Period)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "period",
        "message": "period must be one of: 7d, 30d, 90d, 1y, all"
      }
    ]
  },
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/summary",
  "method": "GET"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch dashboard summary",
  "error": "Database connection error",
  "timestamp": "2024-10-19T10:00:00.000Z",
  "path": "/api/admin/dashboard/summary",
  "method": "GET"
}
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
// Get dashboard summary
const getDashboardSummary = async (period = '30d', includeCharts = true) => {
  try {
    const response = await fetch(`/api/admin/dashboard/summary?period=${period}&includeCharts=${includeCharts}`, {
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
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

// Usage
const dashboardData = await getDashboardSummary('7d', true);
console.log('Total Users:', dashboardData.overview.totalUsers);
console.log('Recent Activity:', dashboardData.recentActivity);
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

// Get dashboard summary
const getDashboardSummary = async (period = '30d', includeCharts = true) => {
  try {
    const response = await apiClient.get('/admin/dashboard/summary', {
      params: { period, includeCharts }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

// Usage
const dashboardData = await getDashboardSummary('30d', true);
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useDashboard = (period = '30d', includeCharts = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/dashboard/summary?period=${period}&includeCharts=${includeCharts}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, includeCharts]);

  return { data, loading, error };
};

// Usage in component
const Dashboard = () => {
  const { data, loading, error } = useDashboard('30d', true);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total Users: {data.overview.totalUsers}</p>
      <p>Active Projects: {data.overview.activeProjects}</p>
      {/* Render other dashboard components */}
    </div>
  );
};
```

---

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code when limit exceeded

## Caching Recommendations
- **Dashboard Data**: Cache for 5-10 minutes
- **Chart Data**: Cache for 15-30 minutes
- **User Statistics**: Cache for 1-2 minutes
- **Real-time Updates**: Use WebSocket for live updates

This API provides all the data needed to build a comprehensive admin dashboard with statistics, charts, and real-time insights.


