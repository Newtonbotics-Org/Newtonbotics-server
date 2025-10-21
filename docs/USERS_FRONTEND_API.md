# Frontend Users Page API Documentation

This document provides comprehensive API endpoints for managing users in the Newton Robotics Server system, specifically designed for frontend user management interfaces.

## Authentication

All endpoints require authentication with a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

- **Admin Only**: Full user management, statistics, bulk operations
- **Self Access**: Users can view and update their own profiles
- **Public Access**: Limited profile information for other users

---

## 1. Get All Users (Admin Only)

**Endpoint:** `GET /api/users`

**Access:** Admin Only

**Query Parameters:**
- `q` (optional): Search query for name, skills, bio (1-100 chars)
- `role` (optional): Filter by role - `student`, `team_member`, `mentor`, `researcher`, `community`, `admin`
- `department` (optional): Filter by department (max 100 chars)
- `skills` (optional): Filter by skills (array of skill names)
- `limit` (optional): Number of results per page (1-100, default: 20)
- `skip` (optional): Number of results to skip for pagination (default: 0)

**Example Request:**
```bash
GET /api/users?role=student&department=Computer Science&limit=10&skip=0
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "email": "john.doe@university.edu",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student",
        "studentId": "CS2024001",
        "department": "Computer Science",
        "yearOfStudy": 3,
        "phone": "+1234567890",
        "profileImageUrl": "https://example.com/profile.jpg",
        "bio": "Passionate about robotics and AI",
        "skills": ["Python", "Machine Learning", "Robotics"],
        "isActive": true,
        "emailVerified": true,
        "permissions": ["read:projects", "read:workshops", "read:events"],
        "preferences": {
          "notifications": { "email": true, "push": true, "sms": false },
          "privacy": { "profileVisibility": "members", "showEmail": false, "showPhone": false },
          "theme": "auto"
        },
        "lastLogin": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

## 2. Get Current User Profile

**Endpoint:** `GET /api/users/profile`

**Access:** Any Authenticated User

**Example Request:**
```bash
GET /api/users/profile
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "john.doe@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": "CS2024001",
      "department": "Computer Science",
      "yearOfStudy": 3,
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "bio": "Passionate about robotics and AI",
      "skills": ["Python", "Machine Learning", "Robotics"],
      "isActive": true,
      "emailVerified": true,
      "permissions": ["read:projects", "read:workshops", "read:events"],
      "preferences": {
        "notifications": { "email": true, "push": true, "sms": false },
        "privacy": { "profileVisibility": "members", "showEmail": false, "showPhone": false },
        "theme": "auto"
      },
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## 3. Get User by ID

**Endpoint:** `GET /api/users/:id`

**Access:** Self or Admin

**Path Parameters:**
- `id`: MongoDB ObjectId of the user

**Example Request:**
```bash
GET /api/users/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "john.doe@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": "CS2024001",
      "department": "Computer Science",
      "yearOfStudy": 3,
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "bio": "Passionate about robotics and AI",
      "skills": ["Python", "Machine Learning", "Robotics"],
      "isActive": true,
      "emailVerified": true,
      "permissions": ["read:projects", "read:workshops", "read:events"],
      "preferences": {
        "notifications": { "email": true, "push": true, "sms": false },
        "privacy": { "profileVisibility": "members", "showEmail": false, "showPhone": false },
        "theme": "auto"
      },
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## 4. Update Current User Profile

**Endpoint:** `PUT /api/users/profile`

**Access:** Any Authenticated User

**Request Body:** (All fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "studentId": "CS2024001",
  "department": "Computer Science",
  "yearOfStudy": 3,
  "phone": "+1234567890",
  "bio": "Updated bio information",
  "skills": ["Python", "Machine Learning", "Robotics", "JavaScript"],
  "profileImageUrl": "https://example.com/new-profile.jpg",
  "preferences": {
    "notifications": { "email": true, "push": false, "sms": false },
    "privacy": { "profileVisibility": "public", "showEmail": true, "showPhone": false },
    "theme": "dark"
  }
}
```

**Restrictions:**
- Cannot update: `role`, `permissions`, `isActive`, `emailVerified`, `email`
- Student ID must be unique if provided

**Example Request:**
```bash
PUT /api/users/profile
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "bio": "Updated bio with more details about my interests",
  "skills": ["Python", "Machine Learning", "Robotics", "JavaScript", "React"],
  "preferences": {
    "theme": "dark"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "john.doe@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": "CS2024001",
      "department": "Computer Science",
      "yearOfStudy": 3,
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "bio": "Updated bio with more details about my interests",
      "skills": ["Python", "Machine Learning", "Robotics", "JavaScript", "React"],
      "isActive": true,
      "emailVerified": true,
      "permissions": ["read:projects", "read:workshops", "read:events"],
      "preferences": {
        "notifications": { "email": true, "push": true, "sms": false },
        "privacy": { "profileVisibility": "members", "showEmail": false, "showPhone": false },
        "theme": "dark"
      },
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-16T14:30:00Z"
    }
  }
}
```

---

## 5. Update User by ID (Admin Only)

**Endpoint:** `PUT /api/users/:id`

**Access:** Admin Only

**Path Parameters:**
- `id`: MongoDB ObjectId of the user

**Request Body:** (All fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "role": "team_member",
  "studentId": "CS2024001",
  "department": "Computer Science",
  "yearOfStudy": 3,
  "phone": "+1234567890",
  "bio": "Updated bio information",
  "skills": ["Python", "Machine Learning", "Robotics"],
  "profileImageUrl": "https://example.com/profile.jpg",
  "isActive": true,
  "emailVerified": true,
  "permissions": ["read:projects", "write:projects", "read:workshops"],
  "preferences": {
    "notifications": { "email": true, "push": true, "sms": false },
    "privacy": { "profileVisibility": "members", "showEmail": false, "showPhone": false },
    "theme": "auto"
  }
}
```

**Example Request:**
```bash
PUT /api/users/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "team_member",
  "permissions": ["read:projects", "write:projects", "read:workshops", "read:events"],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "john.doe@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "team_member",
      "studentId": "CS2024001",
      "department": "Computer Science",
      "yearOfStudy": 3,
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "bio": "Passionate about robotics and AI",
      "skills": ["Python", "Machine Learning", "Robotics"],
      "isActive": true,
      "emailVerified": true,
      "permissions": ["read:projects", "write:projects", "read:workshops", "read:events"],
      "preferences": {
        "notifications": { "email": true, "push": true, "sms": false },
        "privacy": { "profileVisibility": "members", "showEmail": false, "showPhone": false },
        "theme": "auto"
      },
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-16T15:00:00Z"
    }
  }
}
```

**Note:** Role changes trigger automatic email notifications to the user.

---

## 6. Delete User (Admin Only)

**Endpoint:** `DELETE /api/users/:id`

**Access:** Admin Only

**Path Parameters:**
- `id`: MongoDB ObjectId of the user

**Restrictions:**
- Cannot delete your own account
- Performs soft delete (marks as inactive)

**Example Request:**
```bash
DELETE /api/users/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## 7. Reactivate User (Admin Only)

**Endpoint:** `POST /api/users/:id/reactivate`

**Access:** Admin Only

**Path Parameters:**
- `id`: MongoDB ObjectId of the user

**Example Request:**
```bash
POST /api/users/64f1a2b3c4d5e6f7g8h9i0j1/reactivate
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User reactivated successfully"
}
```

---

## 8. Get User Statistics (Admin Only)

**Endpoint:** `GET /api/users/statistics`

**Access:** Admin Only

**Example Request:**
```bash
GET /api/users/statistics
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 250,
      "activeUsers": 240,
      "verifiedUsers": 200,
      "roleDistribution": [
        { "role": "student", "count": 180 },
        { "role": "team_member", "count": 35 },
        { "role": "mentor", "count": 20 },
        { "role": "researcher", "count": 10 },
        { "role": "community", "count": 3 },
        { "role": "admin", "count": 2 }
      ]
    }
  }
}
```

---

## 9. Get Departments List

**Endpoint:** `GET /api/users/departments`

**Access:** Any Authenticated User

**Example Request:**
```bash
GET /api/users/departments
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "departments": [
      "Computer Science",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Robotics Engineering",
      "Artificial Intelligence",
      "Data Science"
    ]
  }
}
```

---

## 10. Get Roles List

**Endpoint:** `GET /api/users/roles`

**Access:** Any Authenticated User

**Example Request:**
```bash
GET /api/users/roles
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      "student",
      "team_member",
      "mentor",
      "researcher",
      "community",
      "admin"
    ]
  }
}
```

---

## 11. Get User Dashboard

**Endpoint:** `GET /api/users/dashboard`

**Access:** Any Authenticated User

**Example Request:**
```bash
GET /api/users/dashboard
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "user": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "displayName": "John Doe",
        "role": "student",
        "department": "Computer Science",
        "subroles": [],
        "profileCompletion": 85,
        "createdAt": "2024-01-01T00:00:00Z"
      },
      "achievements": [
        {
          "title": "Best Project Award",
          "description": "Won first place in robotics competition",
          "date": "2024-01-10T00:00:00Z",
          "type": "award"
        }
      ],
      "projects": {
        "total": 3,
        "items": [
          {
            "id": "64f1a2b3c4d5e6f7g8h9i0j2",
            "title": "Autonomous Robot Navigation",
            "status": "ongoing",
            "category": "Robotics",
            "progress": 65,
            "startDate": "2024-01-01T00:00:00Z",
            "endDate": "2024-06-01T00:00:00Z",
            "teamLeaderId": "64f1a2b3c4d5e6f7g8h9i0j1",
            "teamSize": 4,
            "achievements": []
          }
        ]
      },
      "events": {
        "organized": [],
        "registered": [
          {
            "id": "64f1a2b3c4d5e6f7g8h9i0j3",
            "title": "Robotics Workshop 2024",
            "type": "workshop",
            "startDate": "2024-02-01T00:00:00Z",
            "endDate": "2024-02-03T00:00:00Z",
            "status": "upcoming",
            "registrationStatus": "registered"
          }
        ]
      },
      "workshops": {
        "instructed": [],
        "registered": [
          {
            "id": "64f1a2b3c4d5e6f7g8h9i0j4",
            "title": "Machine Learning Basics",
            "startDate": "2024-01-15T00:00:00Z",
            "endDate": "2024-01-20T00:00:00Z",
            "status": "completed",
            "registrationStatus": "attended"
          }
        ]
      },
      "competitions": {
        "participatedCount": 2
      },
      "communications": {
        "inboxCount": 5,
        "sentCount": 12,
        "recentInbox": [
          {
            "id": "64f1a2b3c4d5e6f7g8h9i0j5",
            "subject": "Project Update Required",
            "isRead": false,
            "createdAt": "2024-01-16T10:00:00Z"
          }
        ]
      },
      "applications": {
        "newsApplications": [
          {
            "type": "newsletter",
            "status": "approved",
            "submittedAt": "2024-01-10T00:00:00Z"
          }
        ],
        "projectRequests": [
          {
            "title": "AI-Powered Robot Navigation",
            "status": "pending",
            "submittedAt": "2024-01-15T00:00:00Z"
          }
        ]
      }
    }
  }
}
```

---

## 12. Get Specific User Dashboard

**Endpoint:** `GET /api/users/:id/dashboard`

**Access:** Self or Admin

**Path Parameters:**
- `id`: MongoDB ObjectId of the user

**Example Request:**
```bash
GET /api/users/64f1a2b3c4d5e6f7g8h9i0j1/dashboard
Authorization: Bearer <user-token>
```

**Response:** Same as above dashboard response

---

## 13. Get All Users Dashboards Summary (Admin Only)

**Endpoint:** `GET /api/users/dashboards/all`

**Access:** Admin Only

**Example Request:**
```bash
GET /api/users/dashboards/all
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboards": [
      {
        "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "John Doe",
        "role": "student",
        "department": "Computer Science",
        "createdAt": "2024-01-01T00:00:00Z",
        "stats": {
          "projects": 3,
          "achievements": 1,
          "competitionsParticipated": 2,
          "inboxMessages": 5
        }
      },
      {
        "userId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Jane Smith",
        "role": "mentor",
        "department": "Robotics Engineering",
        "createdAt": "2023-12-01T00:00:00Z",
        "stats": {
          "projects": 8,
          "achievements": 5,
          "competitionsParticipated": 0,
          "inboxMessages": 12
        }
      }
    ]
  }
}
```

---

## Data Model Reference

### User Schema

```javascript
{
  email: String,                    // Required, unique, max 255 chars
  passwordHash: String,             // Required, min 8 chars
  firstName: String,                // Required, 2-100 chars
  lastName: String,                 // Required, 2-100 chars
  role: String,                     // Enum: student, team_member, mentor, researcher, community, admin
  subroles: [String],               // Optional array of specialized roles
  specialization: String,           // Optional, max 200 chars
  experienceYears: Number,          // Optional, 0-50
  currentProjects: [{               // Optional array
    projectId: ObjectId,            // ref: Project
    role: String,                   // max 100 chars
    involvement: String             // Enum: leading, contributing, mentoring
  }],
  achievements: [{                   // Optional array
    title: String,                   // Required, max 200 chars
    description: String,             // Optional, max 500 chars
    date: Date,                      // Optional
    type: String                     // Enum: award, certification, publication, patent, other
  }],
  socialLinks: {                    // Optional object
    linkedin: String,               // Optional, LinkedIn URL
    github: String,                  // Optional, GitHub URL
    portfolio: String,              // Optional, Portfolio URL
    researchGate: String            // Optional, ResearchGate URL
  },
  studentId: String,                // Optional, unique, max 50 chars
  department: String,                // Optional, max 100 chars
  yearOfStudy: Number,               // Optional, 1-8
  phone: String,                    // Optional, max 20 chars
  profileImageUrl: String,          // Optional, valid image URL
  bio: String,                      // Optional, max 1000 chars
  skills: [String],                 // Optional array, max 100 chars each
  isActive: Boolean,                // Default: true
  emailVerified: Boolean,           // Default: false
  lastLogin: Date,                  // Optional
  permissions: [String],             // Auto-generated based on role
  preferences: {                     // Optional object
    notifications: {                 // Optional
      email: Boolean,                // Default: true
      push: Boolean,                 // Default: true
      sms: Boolean                   // Default: false
    },
    privacy: {                       // Optional
      profileVisibility: String,     // Enum: public, members, private
      showEmail: Boolean,            // Default: false
      showPhone: Boolean             // Default: false
    },
    theme: String                    // Enum: light, dark, auto
  },
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-generated
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "firstName",
      "message": "First name must be between 2 and 100 characters"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. You can only view your own profile"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Student ID is already taken"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Frontend Implementation Tips

### 1. User List Management
- Use pagination for large user lists
- Implement real-time search with debouncing
- Filter by role, department, and skills
- Show user status (active/inactive)

### 2. Profile Management
- Validate form inputs client-side before submission
- Show profile completion percentage
- Handle image uploads separately
- Auto-save draft changes

### 3. Role Management
- Show role hierarchy and permissions
- Implement role change workflows
- Send notifications for role changes
- Track role change history

### 4. Dashboard Integration
- Display user statistics and achievements
- Show recent activity and notifications
- Link to related projects and events
- Provide quick action buttons

### 5. Search and Filtering
- Implement full-text search across names, skills, bio
- Use dropdown filters for roles and departments
- Provide advanced search options
- Save search preferences

---

## Rate Limiting

All endpoints are subject to rate limiting to prevent abuse. Contact the system administrator if you encounter rate limit errors.

---

## Support

For technical support or questions about the Users API, contact the development team or refer to the main API documentation.




