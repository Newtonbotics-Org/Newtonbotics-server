# Deleted Project Requests API

This API endpoint allows admin users to fetch all deleted project requests for administrative purposes.

## Endpoint

```
GET /api/project-requests/deleted
```

## Authentication

- **Required**: Admin token
- **Header**: `Authorization: Bearer <admin_jwt_token>`

## Query Parameters

| Parameter | Type | Required | Description | Default | Valid Values |
|-----------|------|----------|-------------|---------|--------------|
| `status` | string | No | Filter by project status | - | `pending`, `under_review`, `approved`, `rejected`, `on_hold` |
| `submittedBy` | string | No | Filter by user ID who submitted the project | - | Valid MongoDB ObjectId |
| `deletedBy` | string | No | Filter by user ID who deleted the project | - | Valid MongoDB ObjectId |
| `limit` | integer | No | Number of items per page | 20 | 1-100 |
| `skip` | integer | No | Number of items to skip | 0 | ≥0 |
| `sortBy` | string | No | Field to sort by | `deletedAt` | `deletedAt`, `submittedAt`, `title` |
| `sortOrder` | string | No | Sort order | `desc` | `asc`, `desc` |

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "project_request_id",
        "title": "Project Title",
        "description": "Project description...",
        "status": "pending",
        "submittedBy": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "role": "student"
        },
        "deletedBy": {
          "_id": "admin_id",
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com",
          "role": "admin"
        },
        "mentorId": {
          "_id": "mentor_id",
          "firstName": "Mentor",
          "lastName": "Name",
          "email": "mentor@example.com",
          "role": "mentor"
        },
        "teamMembers": [
          {
            "userId": {
              "_id": "member_id",
              "firstName": "Member",
              "lastName": "Name",
              "email": "member@example.com",
              "role": "student"
            },
            "proposedRole": "Developer",
            "skills": ["JavaScript", "React"],
            "availabilityHoursPerWeek": 10
          }
        ],
        "submittedAt": "2024-01-01T00:00:00.000Z",
        "deletedAt": "2024-01-15T00:00:00.000Z",
        "isDeleted": true,
        "auditTrail": [
          {
            "action": "deleted",
            "performedBy": "admin_id",
            "performedAt": "2024-01-15T00:00:00.000Z",
            "changes": {
              "field": "project_request",
              "oldValue": "Project Title",
              "newValue": null
            },
            "reason": "Project request deleted",
            "ipAddress": "127.0.0.1",
            "userAgent": "Mozilla/5.0...",
            "metadata": {
              "timestamp": "2024-01-15T00:00:00.000Z",
              "version": "1.0"
            }
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
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

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required"
}
```

#### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "sortBy",
      "message": "sortBy must be one of: deletedAt, submittedAt, title"
    }
  ]
}
```

## Usage Examples

### Get all deleted projects
```bash
curl -X GET "http://localhost:3000/api/project-requests/deleted" \
  -H "Authorization: Bearer <admin_token>"
```

### Get deleted projects with pagination
```bash
curl -X GET "http://localhost:3000/api/project-requests/deleted?limit=10&skip=20" \
  -H "Authorization: Bearer <admin_token>"
```

### Get deleted projects filtered by status
```bash
curl -X GET "http://localhost:3000/api/project-requests/deleted?status=approved" \
  -H "Authorization: Bearer <admin_token>"
```

### Get deleted projects sorted by submission date
```bash
curl -X GET "http://localhost:3000/api/project-requests/deleted?sortBy=submittedAt&sortOrder=asc" \
  -H "Authorization: Bearer <admin_token>"
```

### Get projects deleted by specific admin
```bash
curl -X GET "http://localhost:3000/api/project-requests/deleted?deletedBy=admin_user_id" \
  -H "Authorization: Bearer <admin_token>"
```

## Testing

Use the provided test script to verify the endpoint functionality:

```bash
# Set your admin token
export ADMIN_TOKEN="your_admin_jwt_token"

# Run the test
node scripts/testDeletedProjectsAPI.js
```

## Notes

- This endpoint only returns soft-deleted projects (where `isDeleted: true`)
- All deleted projects include their complete audit trail
- The endpoint populates related user information for better context
- Pagination is available for large datasets
- Sorting options help organize the results by different criteria
- Filtering capabilities allow admins to find specific deleted projects
