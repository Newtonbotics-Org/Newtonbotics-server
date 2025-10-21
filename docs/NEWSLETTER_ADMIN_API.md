# Newsletter Admin API Documentation

This document describes the comprehensive newsletter admin API that allows administrators to manage newsletter subscriptions and create/send newsletter campaigns.

## Overview

The newsletter admin system provides:
- **Subscription Management**: View, update, and manage newsletter subscriptions
- **Campaign Management**: Create, edit, and manage newsletter campaigns
- **Email Sending**: Send newsletters to targeted audiences with personalization
- **Analytics**: Track campaign performance and subscription statistics
- **Bulk Operations**: Perform bulk operations on subscriptions
- **Export Functionality**: Export subscription data in various formats

## Authentication

All admin endpoints require:
- **Header**: `Authorization: Bearer <admin_token>`
- **Role**: Admin privileges

## API Endpoints

### Subscription Management

#### 1. List Newsletter Subscriptions

**GET** `/api/newsletter/admin/subscriptions`

Get paginated list of newsletter subscriptions with search and filtering.

**Query Parameters:**
- `q` (optional): Search query (searches email, firstName, lastName)
- `status` (optional): Filter by status (`active`, `inactive`, `all`)
- `limit` (optional): Number of results per page (1-100, default: 20)
- `skip` (optional): Number of results to skip (default: 0)
- `sortBy` (optional): Sort field (`email`, `firstName`, `lastName`, `subscribedAt`, `unsubscribedAt`, `createdAt`)
- `sortOrder` (optional): Sort order (`asc`, `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "64f7b1c2e4b0a1b2c3d4e5f6",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "isActive": true,
        "subscribedAt": "2023-09-05T10:30:00.000Z",
        "unsubscribedAt": null,
        "createdAt": "2023-09-05T10:30:00.000Z",
        "updatedAt": "2023-09-05T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

#### 2. Get Specific Subscription

**GET** `/api/newsletter/admin/subscriptions/:id`

Get details of a specific newsletter subscription.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "64f7b1c2e4b0a1b2c3d4e5f6",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "subscribedAt": "2023-09-05T10:30:00.000Z",
      "unsubscribedAt": null,
      "createdAt": "2023-09-05T10:30:00.000Z",
      "updatedAt": "2023-09-05T10:30:00.000Z"
    }
  }
}
```

#### 3. Update Subscription

**PUT** `/api/newsletter/admin/subscriptions/:id`

Update a newsletter subscription.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "subscription": {
      "_id": "64f7b1c2e4b0a1b2c3d4e5f6",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "isActive": false,
      "unsubscribedAt": "2023-09-05T15:30:00.000Z"
    }
  }
}
```

#### 4. Delete Subscription

**DELETE** `/api/newsletter/admin/subscriptions/:id`

Delete a newsletter subscription.

**Response:**
```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

#### 5. Bulk Operations

**POST** `/api/newsletter/admin/bulk-operations`

Perform bulk operations on multiple subscriptions.

**Request Body:**
```json
{
  "emails": ["user1@example.com", "user2@example.com", "user3@example.com"],
  "action": "activate"
}
```

**Actions:**
- `activate`: Activate subscriptions
- `deactivate`: Deactivate subscriptions
- `delete`: Delete subscriptions

**Response:**
```json
{
  "success": true,
  "message": "Bulk activate completed successfully",
  "data": {
    "action": "activate",
    "emailsProcessed": 3,
    "modifiedCount": 2
  }
}
```

#### 6. Export Subscriptions

**POST** `/api/newsletter/admin/export`

Export subscriptions to CSV or JSON format.

**Request Body:**
```json
{
  "format": "csv",
  "status": "active",
  "fields": ["email", "firstName", "lastName", "subscribedAt"]
}
```

**Response:** CSV file download or JSON data

#### 7. Get Statistics

**GET** `/api/newsletter/admin/statistics`

Get newsletter subscription statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSubscriptions": 1250,
      "activeSubscriptions": 1100,
      "inactiveSubscriptions": 150,
      "recentSubscriptions": 25,
      "recentUnsubscriptions": 5
    },
    "topDomains": [
      { "_id": "gmail.com", "count": 450 },
      { "_id": "yahoo.com", "count": 200 }
    ],
    "monthlyGrowth": [
      { "month": "2023-09", "count": 45 },
      { "month": "2023-10", "count": 52 }
    ]
  }
}
```

### Campaign Management

#### 1. Create Newsletter Campaign

**POST** `/api/newsletter/admin/campaigns`

Create a new newsletter campaign.

**Request Body:**
```json
{
  "title": "Monthly Newsletter - October 2023",
  "subject": "Exciting Updates from NewtonBotics",
  "content": "<h2>Hello {{firstName}}!</h2><p>We have exciting news to share...</p>",
  "excerpt": "Monthly updates and announcements from NewtonBotics",
  "targetAudience": "active",
  "template": "news",
  "tags": ["monthly", "updates"],
  "scheduledAt": "2023-10-15T10:00:00.000Z",
  "customEmails": ["special@example.com"],
  "excludeEmails": ["test@example.com"]
}
```

**Target Audience Options:**
- `all`: All subscribers
- `active`: Only active subscribers
- `inactive`: Only inactive subscribers
- `custom`: Only specified custom emails

**Template Options:**
- `default`: Standard template
- `news`: News-focused template
- `announcement`: Announcement template
- `event`: Event-focused template
- `custom`: Custom template

**Response:**
```json
{
  "success": true,
  "message": "Newsletter campaign created successfully",
  "data": {
    "campaign": {
      "_id": "64f7b1c2e4b0a1b2c3d4e5f7",
      "title": "Monthly Newsletter - October 2023",
      "subject": "Exciting Updates from NewtonBotics",
      "content": "<h2>Hello {{firstName}}!</h2><p>We have exciting news to share...</p>",
      "status": "scheduled",
      "targetAudience": "active",
      "template": "news",
      "scheduledAt": "2023-10-15T10:00:00.000Z",
      "sendStats": {
        "totalRecipients": 1100
      },
      "authorId": "64f7b1c2e4b0a1b2c3d4e5f8",
      "createdAt": "2023-09-05T10:30:00.000Z"
    }
  }
}
```

#### 2. List Newsletter Campaigns

**GET** `/api/newsletter/admin/campaigns`

Get paginated list of newsletter campaigns.

**Query Parameters:**
- `q` (optional): Search query (searches title, subject, content)
- `status` (optional): Filter by status (`draft`, `scheduled`, `sending`, `sent`, `cancelled`, `all`)
- `template` (optional): Filter by template
- `authorId` (optional): Filter by author ID
- `limit` (optional): Number of results per page (1-100, default: 20)
- `skip` (optional): Number of results to skip (default: 0)
- `sortBy` (optional): Sort field (`title`, `subject`, `status`, `createdAt`, `scheduledAt`, `sentAt`)
- `sortOrder` (optional): Sort order (`asc`, `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "_id": "64f7b1c2e4b0a1b2c3d4e5f7",
        "title": "Monthly Newsletter - October 2023",
        "subject": "Exciting Updates from NewtonBotics",
        "status": "sent",
        "template": "news",
        "sendStats": {
          "totalRecipients": 1100,
          "sentCount": 1085,
          "failedCount": 15
        },
        "authorId": {
          "_id": "64f7b1c2e4b0a1b2c3d4e5f8",
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@newtonbotics.com"
        },
        "createdAt": "2023-09-05T10:30:00.000Z",
        "sentAt": "2023-10-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 20,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

#### 3. Get Specific Campaign

**GET** `/api/newsletter/admin/campaigns/:id`

Get details of a specific newsletter campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "_id": "64f7b1c2e4b0a1b2c3d4e5f7",
      "title": "Monthly Newsletter - October 2023",
      "subject": "Exciting Updates from NewtonBotics",
      "content": "<h2>Hello {{firstName}}!</h2><p>We have exciting news to share...</p>",
      "status": "sent",
      "targetAudience": "active",
      "template": "news",
      "sendStats": {
        "totalRecipients": 1100,
        "sentCount": 1085,
        "failedCount": 15,
        "openedCount": 0,
        "clickedCount": 0,
        "unsubscribedCount": 0
      },
      "authorId": {
        "_id": "64f7b1c2e4b0a1b2c3d4e5f8",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@newtonbotics.com"
      },
      "createdAt": "2023-09-05T10:30:00.000Z",
      "sentAt": "2023-10-15T10:00:00.000Z"
    },
    "recipientCount": 1100,
    "sampleRecipients": [
      {
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    ]
  }
}
```

#### 4. Update Campaign

**PUT** `/api/newsletter/admin/campaigns/:id`

Update a newsletter campaign (cannot update sent campaigns).

**Request Body:**
```json
{
  "title": "Updated Monthly Newsletter - October 2023",
  "subject": "Updated Exciting Updates from NewtonBotics",
  "content": "<h2>Hello {{firstName}}!</h2><p>We have updated exciting news to share...</p>",
  "targetAudience": "all"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "data": {
    "campaign": {
      "_id": "64f7b1c2e4b0a1b2c3d4e5f7",
      "title": "Updated Monthly Newsletter - October 2023",
      "subject": "Updated Exciting Updates from NewtonBotics",
      "status": "draft",
      "sendStats": {
        "totalRecipients": 1250
      }
    }
  }
}
```

#### 5. Delete Campaign

**DELETE** `/api/newsletter/admin/campaigns/:id`

Delete a newsletter campaign (cannot delete sent campaigns).

**Response:**
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

#### 6. Send Test Newsletter

**POST** `/api/newsletter/admin/campaigns/:id/test`

Send a test newsletter to specified email addresses.

**Request Body:**
```json
{
  "testEmails": ["test1@example.com", "test2@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test newsletter sent successfully",
  "data": {
    "results": {
      "sent": 2,
      "failed": 0,
      "errors": []
    }
  }
}
```

#### 7. Send Campaign

**POST** `/api/newsletter/admin/campaigns/:id/send`

Send a newsletter campaign to all recipients.

**Response:**
```json
{
  "success": true,
  "message": "Newsletter campaign is being sent",
  "data": {
    "campaignId": "64f7b1c2e4b0a1b2c3d4e5f7",
    "totalRecipients": 1100,
    "status": "sending"
  }
}
```

#### 8. Cancel Scheduled Campaign

**POST** `/api/newsletter/admin/campaigns/:id/cancel`

Cancel a scheduled newsletter campaign.

**Response:**
```json
{
  "success": true,
  "message": "Campaign cancelled successfully",
  "data": {
    "campaign": {
      "_id": "64f7b1c2e4b0a1b2c3d4e5f7",
      "status": "cancelled"
    }
  }
}
```

#### 9. Get Campaign Recipients

**GET** `/api/newsletter/admin/campaigns/:id/recipients`

Get the list of recipients for a campaign.

**Query Parameters:**
- `limit` (optional): Number of results per page (1-1000, default: 100)
- `skip` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      {
        "email": "user2@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "pagination": {
      "total": 1100,
      "limit": 100,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

### Analytics

#### 1. Get Newsletter Analytics

**GET** `/api/newsletter/admin/analytics`

Get comprehensive newsletter analytics and statistics.

**Query Parameters:**
- `startDate` (optional): Start date for analytics (ISO 8601 format)
- `endDate` (optional): End date for analytics (ISO 8601 format)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCampaigns": 25,
      "sentCampaigns": 20,
      "draftCampaigns": 3,
      "scheduledCampaigns": 2,
      "totalEmailsSent": 25000
    },
    "performanceByTemplate": [
      {
        "_id": "news",
        "count": 10,
        "totalSent": 12000,
        "totalFailed": 50
      },
      {
        "_id": "announcement",
        "count": 8,
        "totalSent": 8000,
        "totalFailed": 30
      }
    ],
    "recentCampaigns": [
      {
        "_id": "64f7b1c2e4b0a1b2c3d4e5f7",
        "title": "Monthly Newsletter - October 2023",
        "subject": "Exciting Updates from NewtonBotics",
        "status": "sent",
        "createdAt": "2023-09-05T10:30:00.000Z",
        "sendStats": {
          "totalRecipients": 1100,
          "sentCount": 1085,
          "failedCount": 15
        }
      }
    ]
  }
}
```

## Personalization

Newsletter content supports personalization using placeholders:

- `{{firstName}}`: Subscriber's first name
- `{{lastName}}`: Subscriber's last name
- `{{email}}`: Subscriber's email address

Example:
```html
<h2>Hello {{firstName}}!</h2>
<p>Thank you for subscribing to our newsletter, {{firstName}} {{lastName}}.</p>
<p>We'll send updates to {{email}}.</p>
```

## Email Templates

The system includes several pre-built email templates:

### Default Template
Clean, professional design with NewtonBotics branding.

### News Template
News-focused design with gradient header and emphasis on content.

### Announcement Template
Eye-catching design for important announcements with bold styling.

### Event Template
Event-focused design with highlight boxes for important information.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Newsletter sending is rate-limited to prevent overwhelming email services:
- Emails are sent in batches of 10
- 1-second delay between batches
- Background processing for large campaigns

## Security Considerations

1. **Admin Authentication**: All admin endpoints require valid admin tokens
2. **Input Validation**: All inputs are validated and sanitized
3. **Email Validation**: Email addresses are validated and normalized
4. **Content Sanitization**: HTML content is processed safely
5. **Rate Limiting**: Sending is rate-limited to prevent abuse
6. **Logging**: All admin actions are logged for audit purposes

## Usage Examples

### Creating and Sending a Newsletter

1. **Create Campaign:**
```bash
curl -X POST http://localhost:3000/api/newsletter/admin/campaigns \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Newsletter",
    "subject": "Welcome to NewtonBotics!",
    "content": "<h2>Hello {{firstName}}!</h2><p>Welcome to our community...</p>",
    "targetAudience": "active",
    "template": "news"
  }'
```

2. **Send Test:**
```bash
curl -X POST http://localhost:3000/api/newsletter/admin/campaigns/<campaign_id>/test \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "testEmails": ["test@example.com"]
  }'
```

3. **Send Campaign:**
```bash
curl -X POST http://localhost:3000/api/newsletter/admin/campaigns/<campaign_id>/send \
  -H "Authorization: Bearer <admin_token>"
```

### Managing Subscriptions

1. **List Active Subscriptions:**
```bash
curl -X GET "http://localhost:3000/api/newsletter/admin/subscriptions?status=active&limit=50" \
  -H "Authorization: Bearer <admin_token>"
```

2. **Bulk Activate Subscriptions:**
```bash
curl -X POST http://localhost:3000/api/newsletter/admin/bulk-operations \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["user1@example.com", "user2@example.com"],
    "action": "activate"
  }'
```

3. **Export Subscriptions:**
```bash
curl -X POST http://localhost:3000/api/newsletter/admin/export \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "status": "active"
  }'
```

This comprehensive admin API provides all the functionality needed to manage newsletter subscriptions and campaigns effectively.







