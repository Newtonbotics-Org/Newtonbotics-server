# Project Request Admin API Documentation

This document provides comprehensive API endpoints for managing project requests in the Newton Robotics Server system.

## Authentication

All admin endpoints require authentication with a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Admin Role Requirements

- **Admin Only**: `DELETE /api/project-requests/:id` - Delete project requests
- **Mentor+ Access**: `PUT`, `POST /api/project-requests/:id/approve`, `POST /api/project-requests/:id/reject` - Review and manage requests
- **Public Access**: `GET` endpoints - View requests (with optional authentication)

---

## 1. List All Project Requests

**Endpoint:** `GET /api/project-requests`

**Access:** Public (optional authentication)

**Query Parameters:**
- `status` (optional): Filter by status - `pending`, `under_review`, `approved`, `rejected`, `on_hold`
- `mentorId` (optional): Filter by assigned mentor ID
- `submittedBy` (optional): Filter by submitter user ID
- `limit` (optional): Number of results per page (1-100, default: 20)
- `skip` (optional): Number of results to skip for pagination (default: 0)

**Example Request:**
```bash
GET /api/project-requests?status=pending&limit=10&skip=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "title": "AI-Powered Robot Navigation",
        "description": "Develop an autonomous robot navigation system...",
        "objectives": ["Implement SLAM algorithm", "Create obstacle avoidance"],
        "expectedOutcomes": ["Working prototype", "Research paper"],
        "teamSize": 5,
        "estimatedDurationMonths": 6,
        "budgetEstimate": 5000,
        "requiredResources": ["LIDAR sensor", "Development laptop"],
        "mentorId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "status": "pending",
        "submittedBy": "64f1a2b3c4d5e6f7g8h9i0j3",
        "submittedAt": "2024-01-15T10:30:00Z",
        "teamMembers": [
          {
            "userId": "64f1a2b3c4d5e6f7g8h9i0j4",
            "proposedRole": "Lead Developer",
            "skills": ["Python", "ROS", "Computer Vision"],
            "availabilityHoursPerWeek": 20
          }
        ],
        "resources": [
          {
            "resourceType": "equipment",
            "description": "LIDAR sensor for mapping",
            "estimatedCost": 2000,
            "priority": "high"
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

## 2. Get Specific Project Request

**Endpoint:** `GET /api/project-requests/:id`

**Access:** Public (optional authentication)

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Example Request:**
```bash
GET /api/project-requests/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "AI-Powered Robot Navigation",
      "description": "Develop an autonomous robot navigation system...",
      "objectives": ["Implement SLAM algorithm", "Create obstacle avoidance"],
      "expectedOutcomes": ["Working prototype", "Research paper"],
      "teamSize": 5,
      "estimatedDurationMonths": 6,
      "budgetEstimate": 5000,
      "requiredResources": ["LIDAR sensor", "Development laptop"],
      "mentorId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "status": "pending",
      "submittedBy": "64f1a2b3c4d5e6f7g8h9i0j3",
      "submittedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewNotes": null,
      "approvalDate": null,
      "startDate": null,
      "endDate": null,
      "teamMembers": [...],
      "resources": [...],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## 3. Update Project Request (Mentor+ Access)

**Endpoint:** `PUT /api/project-requests/:id`

**Access:** Mentor, Researcher, Admin

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Project Title",
  "description": "Updated project description...",
  "objectives": ["Updated objective 1", "Updated objective 2"],
  "expectedOutcomes": ["Updated outcome 1"],
  "teamSize": 6,
  "estimatedDurationMonths": 8,
  "budgetEstimate": 7500,
  "requiredResources": ["Updated resource 1"],
  "mentorId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "status": "under_review",
  "reviewNotes": "Initial review comments...",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-08-01T00:00:00Z",
  "teamMembers": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j4",
      "proposedRole": "Updated Role",
      "skills": ["Updated Skill 1", "Updated Skill 2"],
      "availabilityHoursPerWeek": 25
    }
  ],
  "resources": [
    {
      "resourceType": "software",
      "description": "Updated software requirement",
      "estimatedCost": 1000,
      "priority": "medium"
    }
  ]
}
```

**Example Request:**
```bash
PUT /api/project-requests/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <mentor-token>
Content-Type: application/json

{
  "status": "under_review",
  "reviewNotes": "Project looks promising, needs budget justification",
  "mentorId": "64f1a2b3c4d5e6f7g8h9i0j2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request updated",
  "data": {
    "item": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "status": "under_review",
      "reviewNotes": "Project looks promising, needs budget justification",
      "mentorId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "reviewedAt": "2024-01-16T14:30:00Z",
      "reviewedBy": "64f1a2b3c4d5e6f7g8h9i0j2",
      "updatedAt": "2024-01-16T14:30:00Z",
      ...
    }
  }
}
```

---

## 4. Approve Project Request (Mentor+ Access)

**Endpoint:** `POST /api/project-requests/:id/approve`

**Access:** Mentor, Researcher, Admin

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Example Request:**
```bash
POST /api/project-requests/64f1a2b3c4d5e6f7g8h9i0j1/approve
Authorization: Bearer <mentor-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Request approved",
  "data": {
    "request": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "status": "approved",
      "approvalDate": "2024-01-16T15:00:00Z",
      "updatedAt": "2024-01-16T15:00:00Z",
      ...
    }
  }
}
```

**Note:** This automatically sends an email notification to the submitter.

---

## 5. Reject Project Request (Mentor+ Access)

**Endpoint:** `POST /api/project-requests/:id/reject`

**Access:** Mentor, Researcher, Admin

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Request Body:**
```json
{
  "reason": "Project scope too broad for current resources"
}
```

**Example Request:**
```bash
POST /api/project-requests/64f1a2b3c4d5e6f7g8h9i0j1/reject
Authorization: Bearer <mentor-token>
Content-Type: application/json

{
  "reason": "Project scope too broad for current resources"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request rejected",
  "data": {
    "request": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "status": "rejected",
      "reviewedAt": "2024-01-16T15:30:00Z",
      "reviewNotes": "Project scope too broad for current resources",
      "updatedAt": "2024-01-16T15:30:00Z",
      ...
    }
  }
}
```

**Note:** This automatically sends an email notification to the submitter.

---

## 6. Delete Project Request (Admin Only)

**Endpoint:** `DELETE /api/project-requests/:id`

**Access:** Admin Only

**Path Parameters:**
- `id`: MongoDB ObjectId of the project request

**Example Request:**
```bash
DELETE /api/project-requests/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project request deleted"
}
```

---

## 7. Create Project Request (Any Authenticated User)

**Endpoint:** `POST /api/project-requests`

**Access:** Any Authenticated User

**Request Body:**
```json
{
  "title": "New Project Idea",
  "description": "Detailed description of the project idea...",
  "objectives": ["Objective 1", "Objective 2"],
  "expectedOutcomes": ["Outcome 1", "Outcome 2"],
  "teamSize": 4,
  "estimatedDurationMonths": 6,
  "budgetEstimate": 3000,
  "requiredResources": ["Resource 1", "Resource 2"],
  "mentorId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "teamMembers": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j4",
      "proposedRole": "Developer",
      "skills": ["Python", "JavaScript"],
      "availabilityHoursPerWeek": 15
    }
  ],
  "resources": [
    {
      "resourceType": "equipment",
      "description": "Development hardware",
      "estimatedCost": 1500,
      "priority": "high"
    }
  ]
}
```

**Required Fields:**
- `title` (5-255 characters)
- `description` (20-5000 characters)
- `teamSize` (1-20)
- `estimatedDurationMonths` (1-24)

**Example Request:**
```bash
POST /api/project-requests
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "title": "Smart Home Automation System",
  "description": "Develop an IoT-based smart home automation system with voice control and mobile app integration...",
  "teamSize": 3,
  "estimatedDurationMonths": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request created",
  "data": {
    "item": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
      "title": "Smart Home Automation System",
      "description": "Develop an IoT-based smart home automation system...",
      "status": "pending",
      "submittedBy": "64f1a2b3c4d5e6f7g8h9i0j3",
      "submittedAt": "2024-01-16T16:00:00Z",
      "createdAt": "2024-01-16T16:00:00Z",
      "updatedAt": "2024-01-16T16:00:00Z",
      ...
    }
  }
}
```

---

## Data Model Reference

### Project Request Schema

```javascript
{
  title: String,                    // Required, 5-255 chars
  description: String,              // Required, 20-5000 chars
  objectives: [String],             // Optional, max 500 chars each
  expectedOutcomes: [String],       // Optional, max 500 chars each
  teamSize: Number,                 // Required, 1-20
  estimatedDurationMonths: Number,  // Required, 1-24
  budgetEstimate: Number,           // Optional, min 0
  requiredResources: [String],      // Optional, max 200 chars each
  mentorId: ObjectId,              // Optional, ref: User
  status: String,                   // Enum: pending, under_review, approved, rejected, on_hold
  submittedBy: ObjectId,            // Required, ref: User
  submittedAt: Date,                // Auto-generated
  reviewedAt: Date,                 // Optional
  reviewedBy: ObjectId,             // Optional, ref: User
  reviewNotes: String,              // Optional, max 2000 chars
  approvalDate: Date,               // Optional
  startDate: Date,                  // Optional
  endDate: Date,                    // Optional
  teamMembers: [{                   // Optional array
    userId: ObjectId,               // Required, ref: User
    proposedRole: String,           // Required, max 100 chars
    skills: [String],              // Optional, max 100 chars each
    availabilityHoursPerWeek: Number // Optional, 1-40
  }],
  resources: [{                     // Optional array
    resourceType: String,           // Enum: equipment, software, funding, space, other
    description: String,            // Required, max 500 chars
    estimatedCost: Number,          // Optional, min 0
    priority: String                // Enum: low, medium, high, critical
  }],
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
      "field": "title",
      "message": "Title must be between 5 and 255 characters"
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
  "message": "Access denied. Required roles: mentor, researcher, admin"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "ProjectRequest not found"
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

## Status Workflow

```
pending → under_review → approved
   ↓           ↓           ↓
rejected ← rejected ← rejected
   ↓
on_hold
```

**Status Descriptions:**
- `pending`: Newly submitted, awaiting review
- `under_review`: Being reviewed by mentor
- `approved`: Approved and ready to become a project
- `rejected`: Rejected with reason
- `on_hold`: Temporarily paused for further consideration

---

## Email Notifications

The system automatically sends email notifications when:
- A project request is approved
- A project request is rejected

Notifications are sent to the submitter's email address with status updates and any review notes.

---

## Rate Limiting

All endpoints are subject to rate limiting to prevent abuse. Contact the system administrator if you encounter rate limit errors.

---

## Support

For technical support or questions about the Project Request API, contact the development team or refer to the main API documentation.

