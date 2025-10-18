# Club Members API Documentation

## Overview
The Club Members API provides access to all non-student users in the NewtonBotics system, including team members, mentors, researchers, admins, and community members.

## Endpoint

### GET /api/users/club-members

Retrieves all club members (excluding students) with their detailed information.

**URL:** `GET /api/users/club-members`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `q` (string, optional): Search query for filtering by name, skills, or bio
- `department` (string, optional): Filter by department
- `skills` (array, optional): Filter by skills (comma-separated)
- `limit` (number, optional): Number of results per page (default: 50, max: 100)
- `skip` (number, optional): Number of results to skip for pagination (default: 0)

## Request Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "clubMembers": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "displayName": "John Doe (Mentor)",
        "role": "mentor",
        "subroles": ["project_manager", "technical_lead"],
        "specialization": "Robotics Engineering",
        "experienceYears": 5,
        "department": "Computer Science",
        "yearOfStudy": null,
        "phone": "+1234567890",
        "profileImageUrl": "https://example.com/profile.jpg",
        "bio": "Experienced robotics engineer with expertise in AI and automation.",
        "skills": ["Python", "ROS", "Machine Learning", "Robotics"],
        "achievements": [
          {
            "title": "Best Project Award 2023",
            "description": "Led team to win national robotics competition",
            "date": "2023-12-01T00:00:00.000Z",
            "type": "award"
          }
        ],
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/johndoe",
          "github": "https://github.com/johndoe",
          "portfolio": "https://johndoe.dev",
          "researchGate": "https://researchgate.net/profile/johndoe"
        },
        "currentProjects": [
          {
            "projectId": "project_id",
            "role": "Lead Developer",
            "involvement": "leading"
          }
        ],
        "emailVerified": true,
        "lastLogin": "2025-01-18T10:30:00.000Z",
        "createdAt": "2023-01-15T08:00:00.000Z",
        "updatedAt": "2025-01-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "message": "Access token required",
    "details": {
      "statusCode": 401,
      "isOperational": true,
      "message": "Access token required"
    }
  },
  "timestamp": "2025-01-18T10:30:00.000Z",
  "path": "/api/users/club-members",
  "method": "GET"
}
```

## User Roles Included

The API returns users with the following roles (students are excluded):
- `team_member`: Active team members
- `mentor`: Mentors and advisors
- `researcher`: Research team members
- `admin`: System administrators
- `community`: Community members

## Example Usage

### Get All Club Members
```bash
curl -X GET "http://localhost:3005/api/users/club-members" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Search Club Members
```bash
curl -X GET "http://localhost:3005/api/users/club-members?q=robotics&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Department
```bash
curl -X GET "http://localhost:3005/api/users/club-members?department=Computer%20Science" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Filter by Skills
```bash
curl -X GET "http://localhost:3005/api/users/club-members?skills=Python,Machine%20Learning" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Pagination
```bash
curl -X GET "http://localhost:3005/api/users/club-members?limit=20&skip=40" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique user identifier |
| `email` | string | User's email address |
| `firstName` | string | User's first name |
| `lastName` | string | User's last name |
| `fullName` | string | User's full name (computed) |
| `displayName` | string | User's display name with role |
| `role` | string | User's primary role |
| `subroles` | array | Additional roles and specializations |
| `specialization` | string | Primary specialization area |
| `experienceYears` | number | Years of experience |
| `department` | string | Academic/professional department |
| `yearOfStudy` | number | Year of study (if applicable) |
| `phone` | string | Contact phone number |
| `profileImageUrl` | string | Profile image URL |
| `bio` | string | User biography |
| `skills` | array | List of skills |
| `achievements` | array | Professional achievements |
| `socialLinks` | object | Social media and professional links |
| `currentProjects` | array | Current project involvements |
| `emailVerified` | boolean | Email verification status |
| `lastLogin` | string | Last login timestamp |
| `createdAt` | string | Account creation timestamp |
| `updatedAt` | string | Last update timestamp |

## Notes

- The API excludes users with `role: "student"`
- Only active users (`isActive: true`) are returned
- Results are sorted by role, then by first name, then by last name
- The search functionality uses MongoDB text search across name, skills, and bio fields
- All timestamps are in ISO 8601 format
- The API requires valid JWT authentication
- Rate limiting applies based on server configuration

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `401`: Unauthorized (missing or invalid token)
- `400`: Bad Request (invalid query parameters)
- `500`: Internal Server Error

## Rate Limiting

The API is subject to the same rate limiting as other authenticated endpoints. Check the server configuration for specific limits.
