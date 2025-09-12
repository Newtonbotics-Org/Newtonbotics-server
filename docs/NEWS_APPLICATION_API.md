# News Application API Documentation

This document describes the comprehensive news application system that allows administrators to create news articles with application forms, and users to apply to these news items.

## Overview

The news application system provides:
- **Create/Update News with Application Forms**: Admins can create news articles with customizable application forms
- **Application Submission**: Users can apply to news items with application forms
- **Deadline Management**: Automatic enforcement of application deadlines
- **Capacity Management**: Limit the number of applicants
- **Status Tracking**: Track application status from submission to final decision
- **Email Notifications**: Automatic email notifications for status updates

## API Endpoints

### 1. Create News with Application Form (Admin)

**POST** `/api/news/admin`

Creates a new news article with optional application form configuration.

#### Authentication
- **Required**: Admin token
- **Header**: `Authorization: Bearer <token>`

#### Request Body
```json
{
  "title": "Robotics Workshop with Application",
  "content": "Join our advanced robotics workshop...",
  "excerpt": "Advanced robotics workshop with application form",
  "authorId": "68a30681af3f3b7d9e2653a3",
  "isPublished": true,
  "tags": ["robotics", "workshop", "application"],
  "application": {
    "isEnabled": true,
    "type": "workshop",
    "requireLogin": false,
    "deadline": "2025-09-06T21:48:32.645Z",
    "maxApplicants": 25,
    "formFields": [
      {
        "name": "experience",
        "label": "Experience Level",
        "type": "select",
        "required": true,
        "options": ["Beginner", "Intermediate", "Advanced"]
      },
      {
        "name": "motivation",
        "label": "Why do you want to join?",
        "type": "textarea",
        "required": true
      },
      {
        "name": "availability",
        "label": "Available Dates",
        "type": "checkbox",
        "required": false,
        "options": ["March 15-17", "April 12-14", "May 10-12"]
      }
    ]
  }
}
```

#### Application Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isEnabled` | boolean | No | Enable/disable application form |
| `type` | string | No | Type: `workshop`, `event`, `competition`, `other` |
| `requireLogin` | boolean | No | Require user login to apply |
| `deadline` | ISO8601 | No | Application deadline |
| `maxApplicants` | number | No | Maximum number of applicants |
| `formFields` | array | No | Custom form fields |

#### Form Field Types

| Type | Description | Options Required |
|------|-------------|------------------|
| `text` | Single line text | No |
| `email` | Email address | No |
| `phone` | Phone number | No |
| `textarea` | Multi-line text | No |
| `select` | Dropdown selection | Yes |
| `radio` | Radio button group | Yes |
| `checkbox` | Checkbox group | Yes |
| `url` | URL field | No |
| `number` | Numeric field | No |

#### Success Response (201)
```json
{
  "success": true,
  "message": "News article created successfully",
  "data": {
    "item": {
      "_id": "68b371b0a203f12489b502cd",
      "title": "Robotics Workshop with Application",
      "application": {
        "isEnabled": true,
        "type": "workshop",
        "deadline": "2025-09-06T21:48:32.645Z",
        "maxApplicants": 25,
        "formFields": [...]
      }
    }
  }
}
```

### 2. Update News Application (Admin)

**PUT** `/api/news/admin/:id`

Updates an existing news article's application configuration.

#### Authentication
- **Required**: Admin token
- **Header**: `Authorization: Bearer <token>`

#### URL Parameters
- `id`: News article ID

#### Request Body
All fields are optional. Only include the fields you want to update:

```json
{
  "application": {
    "isEnabled": true,
    "type": "competition",
    "requireLogin": true,
    "deadline": "2025-09-02T21:48:32.860Z",
    "maxApplicants": 50,
    "formFields": [
      {
        "name": "teamName",
        "label": "Team Name",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "News article updated successfully",
  "data": {
    "item": {
      "_id": "68b371b0a203f12489b502cd",
      "application": {
        "isEnabled": true,
        "deadline": "2025-09-02T21:48:32.860Z",
        "maxApplicants": 50
      }
    }
  }
}
```

### 3. Apply to News Article

**POST** `/api/news/:id/apply`

Submit an application to a news article with an enabled application form.

#### Authentication
- **Optional**: User token (if `requireLogin` is true)
- **Header**: `Authorization: Bearer <token>` (if required)

#### URL Parameters
- `id`: News article ID

#### Request Body
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "responses": [
    {
      "fieldName": "experience",
      "value": "Intermediate"
    },
    {
      "fieldName": "motivation",
      "value": "I want to learn advanced robotics techniques."
    },
    {
      "fieldName": "availability",
      "value": ["March 15-17", "April 12-14"]
    }
  ]
}
```

#### Validation Rules
- **Deadline**: Applications after deadline are rejected
- **Max Applicants**: Applications beyond limit are rejected
- **Required Fields**: All required form fields must be provided
- **Field Options**: Values must match configured options for select/radio/checkbox fields
- **Login Required**: If `requireLogin` is true, user must be authenticated

#### Success Response (201)
```json
{
  "success": true,
  "message": "Application submitted",
  "data": {
    "application": {
      "_id": "68b371b0a203f12489b502ce",
      "newsId": "68b371b0a203f12489b502cd",
      "type": "workshop",
      "applicant": {
        "userId": "68a30681af3f3b7d9e2653a3",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890"
      },
      "responses": [...],
      "status": "submitted",
      "submittedAt": "2025-08-30T21:48:32.645Z"
    }
  }
}
```

### 4. Get Application Status

**GET** `/api/news/:id/application-status`

Check if the current user has applied to a news article and get application status.

#### Authentication
- **Required**: User token
- **Header**: `Authorization: Bearer <token>`

#### URL Parameters
- `id`: News article ID

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "hasApplied": true,
    "canApply": false,
    "reason": "Already applied",
    "application": {
      "id": "68b371b0a203f12489b502ce",
      "status": "submitted",
      "submittedAt": "2025-08-30T21:48:32.645Z",
      "reviewedAt": null,
      "notes": null
    }
  }
}
```

#### Response Scenarios

| Scenario | hasApplied | canApply | reason |
|----------|------------|----------|---------|
| Not applied yet | false | true | null |
| Already applied | true | false | "Already applied" |
| Deadline passed | true | false | "Application deadline has passed" |
| Limit reached | true | false | "Application limit reached" |

### 5. Get Applications (Admin/Mentor)

**GET** `/api/news/:id/applications`

Get all applications for a news article (admin/mentor only).

#### Authentication
- **Required**: Mentor/Admin token
- **Header**: `Authorization: Bearer <token>`

#### URL Parameters
- `id`: News article ID

#### Query Parameters
- `status`: Filter by status (`submitted`, `reviewed`, `accepted`, `rejected`, `waitlisted`, `withdrawn`)
- `limit`: Number of results (1-100, default: 20)
- `skip`: Number of results to skip (default: 0)

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "68b371b0a203f12489b502ce",
        "newsId": "68b371b0a203f12489b502cd",
        "type": "workshop",
        "applicant": {
          "userId": {
            "_id": "68a30681af3f3b7d9e2653a3",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com"
          },
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phone": "+1234567890"
        },
        "responses": [...],
        "status": "submitted",
        "submittedAt": "2025-08-30T21:48:32.645Z",
        "reviewedAt": null,
        "reviewerId": null,
        "notes": null
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

### 6. Update Application Status (Admin/Mentor)

**PUT** `/api/news/:id/applications/:applicationId/status`

Update the status of an application (admin/mentor only).

#### Authentication
- **Required**: Mentor/Admin token
- **Header**: `Authorization: Bearer <token>`

#### URL Parameters
- `id`: News article ID
- `applicationId`: Application ID

#### Request Body
```json
{
  "status": "accepted",
  "notes": "Excellent background and motivation. Welcome to the workshop!"
}
```

#### Status Options
- `submitted`: Initial submission
- `reviewed`: Under review
- `accepted`: Application accepted
- `rejected`: Application rejected
- `waitlisted`: Application waitlisted
- `withdrawn`: Application withdrawn

#### Success Response (200)
```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {
    "application": {
      "_id": "68b371b0a203f12489b502ce",
      "status": "accepted",
      "reviewedAt": "2025-08-30T22:00:00.000Z",
      "reviewerId": "68a30681af3f3b7d9e2653a3",
      "notes": "Excellent background and motivation. Welcome to the workshop!"
    }
  }
}
```

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "error": {
    "message": "Missing required fields: experience, motivation"
  }
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "error": {
    "message": "Login required to apply."
  }
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Admin privileges required."
  }
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": {
    "message": "News article not found"
  }
}
```

## Testing Examples

### cURL Examples

#### Create News with Application
```bash
curl -X POST http://localhost:3005/api/news/admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Robotics Workshop",
    "content": "Join our workshop...",
    "authorId": "68a30681af3f3b7d9e2653a3",
    "isPublished": true,
    "application": {
      "isEnabled": true,
      "type": "workshop",
      "deadline": "2025-09-06T21:48:32.645Z",
      "maxApplicants": 25,
      "formFields": [
        {
          "name": "experience",
          "label": "Experience Level",
          "type": "select",
          "required": true,
          "options": ["Beginner", "Intermediate", "Advanced"]
        }
      ]
    }
  }'
```

#### Apply to News
```bash
curl -X POST http://localhost:3005/api/news/68b371b0a203f12489b502cd/apply \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "responses": [
      {
        "fieldName": "experience",
        "value": "Intermediate"
      }
    ]
  }'
```

#### Get Application Status
```bash
curl -X GET http://localhost:3005/api/news/68b371b0a203f12489b502cd/application-status \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

## Features

### ✅ **Deadline Management**
- Automatic deadline enforcement
- Applications rejected after deadline
- Configurable deadline dates

### ✅ **Capacity Management**
- Maximum applicant limits
- Automatic rejection when limit reached
- Real-time capacity tracking

### ✅ **Form Validation**
- Required field validation
- Option validation for select/radio/checkbox fields
- Custom field types support

### ✅ **Status Tracking**
- Complete application lifecycle tracking
- Status updates with timestamps
- Reviewer tracking

### ✅ **Email Notifications**
- Automatic status update emails
- Customizable email messages
- Best-effort delivery

### ✅ **Security**
- Role-based access control
- Optional login requirements
- Input validation and sanitization

## Frontend Integration

### Application Status Check
```javascript
// Check if user can apply
const response = await fetch(`/api/news/${newsId}/application-status`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

if (data.data.canApply) {
  // Show apply button
} else {
  // Show status or reason
  console.log(data.data.reason);
}
```

### Apply Form Submission
```javascript
// Submit application
const response = await fetch(`/api/news/${newsId}/apply`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@example.com',
    responses: [
      { fieldName: 'experience', value: 'Intermediate' }
    ]
  })
});
```

This comprehensive API system provides everything needed for managing news articles with application forms, from creation to final decision making.
