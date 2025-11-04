# Team Members API Documentation

Complete API documentation for fetching team members' details. Multiple endpoints are available depending on your access level and needs.

**Base URLs:**
- `/api/users` - Requires authentication
- `/api/public` - Public endpoints (optional auth)

---

## 1. Get All Team Members (Authenticated)

**Endpoint:** `GET /api/users/club-members`

**Access:** Authenticated users (requires Bearer token)

**Description:** Returns all active club members (team_member, mentor, researcher, admin, community) excluding students.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**
- `q` (optional, string): Search query (searches in name, skills, bio)
- `department` (optional, string): Filter by department
- `skills` (optional, string/array): Filter by skills (comma-separated or array)
- `limit` (optional, integer, 1-100): Number of results per page (default: 50)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/users/club-members?department=Computer%20Science&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clubMembers": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "john.doe@example.com",
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
        "bio": "Experienced robotics engineer...",
        "skills": ["Python", "ROS", "Machine Learning"],
        "achievements": [
          {
            "title": "Best Project Award 2023",
            "description": "Led team to win...",
            "date": "2023-12-01T00:00:00.000Z",
            "type": "award"
          }
        ],
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/johndoe",
          "github": "https://github.com/johndoe"
        },
        "currentProjects": [],
        "emailVerified": true,
        "lastLogin": "2025-01-18T10:30:00.000Z",
        "createdAt": "2023-01-15T08:00:00.000Z",
        "updatedAt": "2025-01-18T10:30:00.000Z"
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

**Roles Included:**
- `team_member`
- `mentor`
- `researcher`
- `admin`
- `community`

**Note:** Students are excluded from this endpoint.

---

## 2. Get All Team Members (Public)

**Endpoint:** `GET /api/public/team-members`

**Access:** Public (no authentication required)

**Description:** Returns all active team members (role: `team_member`) with public information.

**Query Parameters:**
- `q` (optional, string): Search query
- `department` (optional, string): Filter by department
- `limit` (optional, integer, 1-100): Number of results per page (default: 20)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/public/team-members?department=Computer%20Science&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "displayName": "John Doe",
        "role": "team_member",
        "profileImageUrl": "https://example.com/profile.jpg",
        "department": "Computer Science",
        "bio": "Passionate about robotics...",
        "skills": ["Python", "ROS"]
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

**Note:** This endpoint respects privacy settings and may hide email/phone based on user preferences.

---

## 3. Get All Users (Admin Only)

**Endpoint:** `GET /api/users`

**Access:** Admin only (requires Bearer token)

**Description:** Returns all active users including students. Full access to all user details.

**Headers:**
```
Authorization: Bearer <your-admin-jwt-token>
Content-Type: application/json
```

**Query Parameters:**
- `q` (optional, string): Search query
- `role` (optional, string): Filter by role (student, team_member, mentor, researcher, community, admin)
- `department` (optional, string): Filter by department
- `skills` (optional, string/array): Filter by skills
- `limit` (optional, integer, 1-100): Number of results per page (default: 20)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/users?role=team_member&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "team_member",
        "studentId": "STU001",
        "department": "Computer Science",
        "yearOfStudy": 3,
        "phone": "+1234567890",
        "profileImageUrl": "https://example.com/profile.jpg",
        "bio": "Passionate about robotics...",
        "skills": ["Python", "ROS", "Machine Learning"],
        "isActive": true,
        "emailVerified": true,
        "subroles": ["project_manager"],
        "achievements": [],
        "socialLinks": {},
        "createdAt": "2023-01-15T08:00:00.000Z",
        "updatedAt": "2025-01-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

## 4. Get Leadership Team (Public)

**Endpoint:** `GET /api/public/leadership-team`

**Access:** Public (no authentication required)

**Description:** Returns team members with at least one subrole (leadership positions).

**Query Parameters:**
- `q` (optional, string): Search query
- `department` (optional, string): Filter by department
- `limit` (optional, integer, 1-100): Number of results per page (default: 20)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/public/leadership-team
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "displayName": "John Doe",
        "role": "team_member",
        "subroles": ["project_manager", "technical_lead"],
        "profileImageUrl": "https://example.com/profile.jpg",
        "department": "Computer Science",
        "bio": "Leading robotics projects...",
        "skills": ["Python", "ROS", "Leadership"]
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

---

## 5. Get Team Directory (Public)

**Endpoint:** `GET /api/public/team-directory`

**Access:** Public (no authentication required)

**Description:** Returns team members with NO subroles (basic team members, not leadership).

**Query Parameters:**
- `q` (optional, string): Search query
- `department` (optional, string): Filter by department
- `limit` (optional, integer, 1-100): Number of results per page (default: 20)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/public/team-directory?department=Computer%20Science
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "displayName": "Jane Smith",
        "role": "team_member",
        "profileImageUrl": "https://example.com/profile.jpg",
        "department": "Computer Science",
        "bio": "Passionate about robotics...",
        "skills": ["Python", "ROS"]
      }
    ],
    "pagination": {
      "total": 20,
      "limit": 20,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

---

## 6. Get People by Role (Public)

**Endpoint:** `GET /api/public/:role`

**Access:** Public (no authentication required)

**Description:** Get all users with a specific role.

**Path Parameters:**
- `role` (required, string): One of `team_member`, `mentor`, `researcher`, `community`

**Query Parameters:**
- `q` (optional, string): Search query
- `department` (optional, string): Filter by department
- `limit` (optional, integer, 1-100): Number of results per page (default: 20)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/public/team_member?department=Computer%20Science
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "displayName": "John Doe",
        "role": "team_member",
        "profileImageUrl": "https://example.com/profile.jpg",
        "department": "Computer Science",
        "bio": "Passionate about robotics...",
        "skills": ["Python", "ROS"]
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

---

## Summary Table

| Endpoint | Access | Includes Students | Full Details | Authentication |
|----------|--------|-------------------|--------------|----------------|
| `GET /api/users/club-members` | Authenticated | ❌ No | ✅ Yes | ✅ Required |
| `GET /api/public/team-members` | Public | ❌ No | ⚠️ Limited | ❌ Optional |
| `GET /api/users` | Admin | ✅ Yes | ✅ Yes | ✅ Required (Admin) |
| `GET /api/public/leadership-team` | Public | ❌ No | ⚠️ Limited | ❌ Optional |
| `GET /api/public/team-directory` | Public | ❌ No | ⚠️ Limited | ❌ Optional |
| `GET /api/public/:role` | Public | ❌ No | ⚠️ Limited | ❌ Optional |

---

## Response Fields Comparison

### Full Details (Authenticated/Admin Endpoints)
- ✅ All user fields
- ✅ Email address
- ✅ Phone number
- ✅ Full achievements
- ✅ Social links
- ✅ Current projects
- ✅ Last login
- ✅ Email verification status

### Limited Details (Public Endpoints)
- ✅ Basic profile info
- ✅ Name and display name
- ✅ Role and subroles
- ✅ Profile image
- ✅ Department
- ✅ Bio
- ✅ Skills
- ⚠️ Email/Phone (only if user allows in privacy settings)

---

## Common Use Cases

### 1. Get All Team Members for Admin Dashboard
```bash
GET /api/users/club-members?role=team_member&limit=100
```
**Use:** When you need full details of all team members (authenticated)

### 2. Display Team Members on Public Website
```bash
GET /api/public/team-members?limit=50
```
**Use:** When you want to show team members publicly

### 3. Get All Users Including Students (Admin)
```bash
GET /api/users?limit=100
```
**Use:** When you need complete user list including students (admin only)

### 4. Show Leadership Team
```bash
GET /api/public/leadership-team
```
**Use:** When you want to highlight leadership positions

### 5. Search Team Members by Skills
```bash
GET /api/users/club-members?skills=Python,ROS&limit=20
```
**Use:** When you need to find team members with specific skills

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Access token required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Insufficient permissions"
  }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": "Invalid query parameters"
  }
}
```

---

## Notes

1. **Authentication:** Most endpoints require authentication. Use `Authorization: Bearer <token>` header.

2. **Privacy Settings:** Public endpoints respect user privacy preferences. Email and phone may be hidden based on user settings.

3. **Pagination:** All list endpoints support pagination with `limit` and `skip` parameters.

4. **Search:** Use the `q` parameter for text search across names, skills, and bio.

5. **Filtering:** Most endpoints support filtering by `department`, `role`, and `skills`.

6. **Rate Limiting:** All endpoints are subject to rate limiting. Check server configuration for limits.

7. **Active Users Only:** All endpoints return only active users (`isActive: true`).

