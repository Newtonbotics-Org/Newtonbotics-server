# Complete General User API Documentation

This document provides comprehensive API endpoints for general users (frontend) with detailed request/response examples.

## Authentication

All private endpoints require authentication with a valid JWT token:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication APIs

### 1. User Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "your_password_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "68f2d0db280c3dd85fac353d",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": "STU001",
      "department": "Computer Science",
      "yearOfStudy": 3,
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "bio": "Passionate about robotics and AI",
      "skills": ["JavaScript", "Python", "Robotics"],
      "isActive": true,
      "emailVerified": true,
      "permissions": ["read:projects", "write:projects", "read:workshops", "read:events", "read:inventory", "read:news", "read:media", "write:requests"],
      "preferences": {
        "notifications": true,
        "theme": "light"
      },
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. User Registration
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "password": "secure_password_123",
  "firstName": "Jane",
  "lastName": "Smith",
  "studentId": "STU002",
  "department": "Electrical Engineering",
  "yearOfStudy": 2,
  "phone": "+1234567891",
  "skills": ["Arduino", "C++", "Electronics"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "68f2d0db280c3dd85fac353e",
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "student",
      "studentId": "STU002",
      "department": "Electrical Engineering",
      "yearOfStudy": 2,
      "phone": "+1234567891",
      "skills": ["Arduino", "C++", "Electronics"],
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Get Current User Info
**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68f2d0db280c3dd85fac353d",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": "STU001",
      "department": "Computer Science",
      "yearOfStudy": 3,
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/profile.jpg",
      "bio": "Passionate about robotics and AI",
      "skills": ["JavaScript", "Python", "Robotics"],
      "isActive": true,
      "emailVerified": true,
      "permissions": ["read:projects", "write:projects", "read:workshops", "read:events", "read:inventory", "read:news", "read:media", "write:requests"],
      "preferences": {
        "notifications": true,
        "theme": "light"
      },
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## 📋 Project Request APIs

### 1. List All Project Requests
**Endpoint:** `GET /api/project-requests`

**Query Parameters:**
- `status` (optional): `pending`, `under_review`, `approved`, `rejected`, `on_hold`
- `mentorId` (optional): Filter by mentor ID
- `submittedBy` (optional): Filter by submitter ID
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/project-requests?status=pending&limit=10&skip=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190df",
        "title": "AI-Powered Robot Navigation",
        "description": "Develop an autonomous robot navigation system using AI and computer vision",
        "objectives": [
          "Implement SLAM algorithm",
          "Create obstacle avoidance system",
          "Develop path planning algorithm"
        ],
        "expectedOutcomes": [
          "Fully autonomous robot",
          "Research paper publication",
          "Open source code repository"
        ],
        "teamSize": 4,
        "estimatedDurationMonths": 6,
        "budgetEstimate": 5000,
        "requiredResources": ["Robotics lab access", "Computer vision cameras", "Development hardware"],
        "mentorId": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu",
          "role": "mentor"
        },
        "status": "pending",
        "submittedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "submittedAt": "2024-01-15T10:30:00Z",
        "teamMembers": [
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "proposedRole": "Team Leader",
            "skills": ["Python", "Computer Vision", "Robotics"],
            "availabilityHoursPerWeek": 20
          }
        ],
        "resources": [
          {
            "resourceType": "equipment",
            "description": "Robotics development kit",
            "estimatedCost": 2000,
            "priority": "high"
          }
        ],
        "auditTrail": [
          {
            "action": "created",
            "performedBy": "68f2d0db280c3dd85fac353d",
            "performedAt": "2024-01-15T10:30:00Z",
            "changes": {
              "field": "project_request",
              "oldValue": null,
              "newValue": "Project request created"
            },
            "reason": "Initial project request submission"
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

### 2. Get My Project Requests
**Endpoint:** `GET /api/project-requests/my-requests`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190df",
        "title": "AI-Powered Robot Navigation",
        "description": "Develop an autonomous robot navigation system using AI and computer vision",
        "status": "pending",
        "submittedAt": "2024-01-15T10:30:00Z",
        "mentorId": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu",
          "role": "mentor"
        },
        "teamMembers": [
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student"
            },
            "proposedRole": "Team Leader",
            "skills": ["Python", "Computer Vision", "Robotics"],
            "availabilityHoursPerWeek": 20
          }
        ]
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 20,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

### 3. Create Project Request
**Endpoint:** `POST /api/project-requests`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Smart Home Automation System",
  "description": "Develop an IoT-based smart home automation system with mobile app control and voice commands",
  "objectives": [
    "Create IoT sensor network",
    "Develop mobile application",
    "Implement voice control integration"
  ],
  "expectedOutcomes": [
    "Working prototype",
    "Mobile app on app stores",
    "Documentation and user guide"
  ],
  "teamSize": 3,
  "estimatedDurationMonths": 4,
  "budgetEstimate": 3000,
  "requiredResources": ["Arduino boards", "Sensors", "Mobile development tools"],
  "teamMembers": [
    {
      "userId": "68f2d0db280c3dd85fac353d",
      "proposedRole": "Project Lead",
      "skills": ["IoT", "Arduino", "Project Management"],
      "availabilityHoursPerWeek": 25
    }
  ],
  "resources": [
    {
      "resourceType": "equipment",
      "description": "Arduino development kits",
      "estimatedCost": 500,
      "priority": "high"
    },
    {
      "resourceType": "software",
      "description": "Mobile app development licenses",
      "estimatedCost": 200,
      "priority": "medium"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request created",
  "data": {
    "item": {
      "_id": "68f2db7b640a945ff91190e0",
      "title": "Smart Home Automation System",
      "description": "Develop an IoT-based smart home automation system with mobile app control and voice commands",
      "objectives": [
        "Create IoT sensor network",
        "Develop mobile application",
        "Implement voice control integration"
      ],
      "expectedOutcomes": [
        "Working prototype",
        "Mobile app on app stores",
        "Documentation and user guide"
      ],
      "teamSize": 3,
      "estimatedDurationMonths": 4,
      "budgetEstimate": 3000,
      "requiredResources": ["Arduino boards", "Sensors", "Mobile development tools"],
      "status": "pending",
      "submittedBy": "68f2d0db280c3dd85fac353d",
      "submittedAt": "2024-01-15T11:00:00Z",
      "teamMembers": [
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353d",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "role": "student"
          },
          "proposedRole": "Project Lead",
          "skills": ["IoT", "Arduino", "Project Management"],
          "availabilityHoursPerWeek": 25
        }
      ],
      "resources": [
        {
          "resourceType": "equipment",
          "description": "Arduino development kits",
          "estimatedCost": 500,
          "priority": "high"
        },
        {
          "resourceType": "software",
          "description": "Mobile app development licenses",
          "estimatedCost": 200,
          "priority": "medium"
        }
      ],
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T11:00:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission"
        }
      ],
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

### 4. Update Project Request
**Endpoint:** `PUT /api/project-requests/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Advanced Smart Home Automation System",
  "description": "Develop an enhanced IoT-based smart home automation system with AI-powered learning and advanced mobile app control",
  "budgetEstimate": 4000,
  "estimatedDurationMonths": 5,
  "reason": "Updated project scope and requirements"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request updated",
  "data": {
    "item": {
      "_id": "68f2db7b640a945ff91190e0",
      "title": "Advanced Smart Home Automation System",
      "description": "Develop an enhanced IoT-based smart home automation system with AI-powered learning and advanced mobile app control",
      "budgetEstimate": 4000,
      "estimatedDurationMonths": 5,
      "auditTrail": [
        {
          "action": "created",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T11:00:00Z",
          "changes": {
            "field": "project_request",
            "oldValue": null,
            "newValue": "Project request created"
          },
          "reason": "Initial project request submission"
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T12:00:00Z",
          "changes": {
            "field": "title",
            "oldValue": "Smart Home Automation System",
            "newValue": "Advanced Smart Home Automation System"
          },
          "reason": "Updated project scope and requirements"
        },
        {
          "action": "updated",
          "performedBy": "68f2d0db280c3dd85fac353d",
          "performedAt": "2024-01-15T12:00:00Z",
          "changes": {
            "field": "budgetEstimate",
            "oldValue": 3000,
            "newValue": 4000
          },
          "reason": "Updated project scope and requirements"
        }
      ],
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

### 5. Delete Project Request
**Endpoint:** `DELETE /api/project-requests/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Project requirements changed, will submit new request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project request deleted"
}
```

### 6. Get Project Request Audit Trail
**Endpoint:** `GET /api/project-requests/:id/audit-trail`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectRequestId": "68f2db7b640a945ff91190e0",
    "projectTitle": "Advanced Smart Home Automation System",
    "auditTrail": [
      {
        "action": "updated",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "performedAt": "2024-01-15T12:00:00Z",
        "changes": {
          "field": "budgetEstimate",
          "oldValue": 3000,
          "newValue": 4000
        },
        "reason": "Updated project scope and requirements",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-15T12:00:00Z",
          "version": "1.0"
        }
      },
      {
        "action": "created",
        "performedBy": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "performedAt": "2024-01-15T11:00:00Z",
        "changes": {
          "field": "project_request",
          "oldValue": null,
          "newValue": "Project request created"
        },
        "reason": "Initial project request submission",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "metadata": {
          "timestamp": "2024-01-15T11:00:00Z",
          "version": "1.0"
        }
      }
    ]
  }
}
```

---

## 🚀 Project APIs

### 1. List All Projects
**Endpoint:** `GET /api/projects`

**Query Parameters:**
- `q` (optional): Search query
- `status` (optional): `upcoming`, `ongoing`, `completed`, `on_hold`
- `category` (optional): Project category
- `mentorId` (optional): Filter by mentor ID
- `teamLeaderId` (optional): Filter by team leader ID
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0
- `sort` (optional): `createdAt`, `startDate`, `endDate`, `progress`
- `order` (optional): `asc`, `desc`

**Example Request:**
```bash
GET /api/projects?status=ongoing&limit=10&sort=startDate&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "68f2db7b640a945ff91190e1",
        "title": "Autonomous Drone Delivery System",
        "description": "Develop an autonomous drone system for package delivery with obstacle avoidance and GPS navigation",
        "category": "Robotics",
        "status": "ongoing",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-06-30T23:59:59Z",
        "budget": 15000,
        "progress": 65,
        "mentorId": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu",
          "role": "mentor"
        },
        "teamLeaderId": {
          "_id": "68f2d0db280c3dd85fac353d",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "role": "student"
        },
        "teamMembers": [
          {
            "userId": {
              "_id": "68f2d0db280c3dd85fac353d",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "role": "student",
              "profileImageUrl": "https://example.com/profile.jpg"
            },
            "role": "Team Leader",
            "joinedAt": "2024-01-01T00:00:00Z"
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
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

### 2. Get Project Details
**Endpoint:** `GET /api/projects/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "68f2db7b640a945ff91190e1",
      "title": "Autonomous Drone Delivery System",
      "description": "Develop an autonomous drone system for package delivery with obstacle avoidance and GPS navigation",
      "category": "Robotics",
      "status": "ongoing",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-06-30T23:59:59Z",
      "budget": 15000,
      "progress": 65,
      "objectives": [
        "Design drone hardware",
        "Implement flight control system",
        "Develop obstacle avoidance algorithm",
        "Create delivery management system"
      ],
      "deliverables": [
        "Working drone prototype",
        "Flight control software",
        "Delivery management app",
        "Technical documentation"
      ],
      "mentorId": {
        "_id": "68f2d0db280c3dd85fac353f",
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@university.edu",
        "role": "mentor"
      },
      "teamLeaderId": {
        "_id": "68f2d0db280c3dd85fac353d",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "student"
      },
      "teamMembers": [
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353d",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "role": "student",
            "profileImageUrl": "https://example.com/profile.jpg"
          },
          "role": "Team Leader",
          "joinedAt": "2024-01-01T00:00:00Z"
        }
      ],
      "milestones": [
        {
          "title": "Hardware Design Complete",
          "description": "Complete drone hardware design and procurement",
          "dueDate": "2024-02-15T23:59:59Z",
          "status": "completed",
          "completedAt": "2024-02-10T10:00:00Z"
        },
        {
          "title": "Flight Control System",
          "description": "Implement basic flight control algorithms",
          "dueDate": "2024-03-31T23:59:59Z",
          "status": "in_progress",
          "completedAt": null
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Create Project
**Endpoint:** `POST /api/projects`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Smart Agriculture Monitoring System",
  "description": "Develop an IoT-based system for monitoring soil conditions, weather, and crop health in agricultural fields",
  "category": "IoT",
  "status": "upcoming",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "budget": 8000,
  "objectives": [
    "Design IoT sensor network",
    "Develop data collection system",
    "Create farmer dashboard",
    "Implement alert system"
  ],
  "deliverables": [
    "Sensor network prototype",
    "Data collection software",
    "Web dashboard",
    "Mobile app for farmers"
  ],
  "teamMembers": [
    {
      "userId": "68f2d0db280c3dd85fac353d",
      "role": "Project Lead"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "_id": "68f2db7b640a945ff91190e2",
      "title": "Smart Agriculture Monitoring System",
      "description": "Develop an IoT-based system for monitoring soil conditions, weather, and crop health in agricultural fields",
      "category": "IoT",
      "status": "upcoming",
      "startDate": "2024-02-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z",
      "budget": 8000,
      "progress": 0,
      "objectives": [
        "Design IoT sensor network",
        "Develop data collection system",
        "Create farmer dashboard",
        "Implement alert system"
      ],
      "deliverables": [
        "Sensor network prototype",
        "Data collection software",
        "Web dashboard",
        "Mobile app for farmers"
      ],
      "teamLeaderId": "68f2d0db280c3dd85fac353d",
      "teamMembers": [
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353d",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "role": "student",
            "profileImageUrl": "https://example.com/profile.jpg"
          },
          "role": "Project Lead",
          "joinedAt": "2024-01-15T11:30:00Z"
        }
      ],
      "createdAt": "2024-01-15T11:30:00Z",
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  }
}
```

---

## 📅 Event APIs

### 1. List All Events
**Endpoint:** `GET /api/events`

**Query Parameters:**
- `status` (optional): `upcoming`, `ongoing`, `completed`, `cancelled`
- `type` (optional): Event type
- `category` (optional): Event category
- `isFeatured` (optional): `true`, `false`
- `requiresRegistration` (optional): `true`, `false`
- `showInNav` (optional): `true`, `false`
- `q` (optional): Search query
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/events?status=upcoming&isFeatured=true&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190e3",
        "title": "Robotics Workshop 2024",
        "description": "Hands-on workshop covering Arduino programming, sensor integration, and robot building",
        "type": "workshop",
        "category": "Education",
        "startDate": "2024-02-15T09:00:00Z",
        "endDate": "2024-02-15T17:00:00Z",
        "location": "Robotics Lab, Building A",
        "maxParticipants": 30,
        "currentParticipants": 15,
        "isFeatured": true,
        "requiresRegistration": true,
        "registrationDeadline": "2024-02-10T23:59:59Z",
        "featureOptions": {
          "showInNav": true,
          "navOrder": 1,
          "featuredImage": "https://example.com/workshop.jpg"
        },
        "organizer": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu"
        },
        "status": "upcoming",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 5,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

### 2. Get Event Details
**Endpoint:** `GET /api/events/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "68f2db7b640a945ff91190e3",
      "title": "Robotics Workshop 2024",
      "description": "Hands-on workshop covering Arduino programming, sensor integration, and robot building",
      "type": "workshop",
      "category": "Education",
      "startDate": "2024-02-15T09:00:00Z",
      "endDate": "2024-02-15T17:00:00Z",
      "location": "Robotics Lab, Building A",
      "maxParticipants": 30,
      "currentParticipants": 15,
      "isFeatured": true,
      "requiresRegistration": true,
      "registrationDeadline": "2024-02-10T23:59:59Z",
      "featureOptions": {
        "showInNav": true,
        "navOrder": 1,
        "featuredImage": "https://example.com/workshop.jpg"
      },
      "organizer": {
        "_id": "68f2d0db280c3dd85fac353f",
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@university.edu"
      },
      "agenda": [
        {
          "time": "09:00-10:30",
          "title": "Introduction to Robotics",
          "description": "Overview of robotics concepts and Arduino basics"
        },
        {
          "time": "10:30-12:00",
          "title": "Sensor Integration",
          "description": "Hands-on session with various sensors"
        }
      ],
      "requirements": [
        "Basic programming knowledge",
        "Laptop with Arduino IDE installed",
        "Enthusiasm to learn!"
      ],
      "status": "upcoming",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Register for Event
**Endpoint:** `POST /api/events/:id/register`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "additionalInfo": "I have experience with Arduino and would like to learn more about advanced robotics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully registered for the event",
  "data": {
    "registration": {
      "_id": "68f2db7b640a945ff91190e4",
      "eventId": "68f2db7b640a945ff91190e3",
      "userId": "68f2d0db280c3dd85fac353d",
      "registeredAt": "2024-01-15T12:00:00Z",
      "additionalInfo": "I have experience with Arduino and would like to learn more about advanced robotics",
      "status": "confirmed"
    }
  }
}
```

---

## 📰 News APIs

### 1. List All News Articles
**Endpoint:** `GET /api/news`

**Query Parameters:**
- `isPublished` (optional): `true`, `false`
- `isFeatured` (optional): `true`, `false`
- `showInNav` (optional): `true`, `false`
- `categoryId` (optional): News category ID
- `q` (optional): Search query
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/news?isPublished=true&isFeatured=true&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190e5",
        "title": "Newton Robotics Lab Wins National Competition",
        "content": "Our robotics team has achieved first place in the National Robotics Competition 2024...",
        "excerpt": "Our robotics team has achieved first place in the National Robotics Competition 2024, showcasing innovative autonomous systems.",
        "categoryId": {
          "_id": "68f2d0db280c3dd85fac353g",
          "name": "Achievements",
          "slug": "achievements"
        },
        "author": {
          "_id": "68f2d0db280c3dd85fac353f",
          "firstName": "Dr. Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu"
        },
        "isPublished": true,
        "isFeatured": true,
        "featureOptions": {
          "showInNav": true,
          "navOrder": 1,
          "featuredImage": "https://example.com/competition.jpg",
          "featuredExcerpt": "First place in National Robotics Competition 2024"
        },
        "tags": ["robotics", "competition", "achievement"],
        "publishedAt": "2024-01-10T10:00:00Z",
        "createdAt": "2024-01-10T09:00:00Z",
        "updatedAt": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 5,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

### 2. Get News Article Details
**Endpoint:** `GET /api/news/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "news": {
      "_id": "68f2db7b640a945ff91190e5",
      "title": "Newton Robotics Lab Wins National Competition",
      "content": "Our robotics team has achieved first place in the National Robotics Competition 2024, showcasing innovative autonomous systems and advanced AI algorithms. The competition featured teams from universities across the country, and our team's autonomous drone delivery system impressed the judges with its precision and reliability.\n\nKey highlights of our winning project:\n- Advanced obstacle avoidance algorithms\n- GPS-based navigation system\n- Real-time package tracking\n- Weather-resistant design\n\nThe team, led by Dr. Sarah Johnson, spent six months developing the system, incorporating cutting-edge technologies in robotics and artificial intelligence. This victory demonstrates our lab's commitment to innovation and excellence in robotics research.\n\nWe look forward to representing our university at the international competition next month.",
      "excerpt": "Our robotics team has achieved first place in the National Robotics Competition 2024, showcasing innovative autonomous systems.",
      "categoryId": {
        "_id": "68f2d0db280c3dd85fac353g",
        "name": "Achievements",
        "slug": "achievements"
      },
      "author": {
        "_id": "68f2d0db280c3dd85fac353f",
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@university.edu"
      },
      "isPublished": true,
      "isFeatured": true,
      "featureOptions": {
        "showInNav": true,
        "navOrder": 1,
        "featuredImage": "https://example.com/competition.jpg",
        "featuredExcerpt": "First place in National Robotics Competition 2024"
      },
      "tags": ["robotics", "competition", "achievement"],
      "publishedAt": "2024-01-10T10:00:00Z",
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-10T10:00:00Z"
    }
  }
}
```

---

## 🔧 Inventory APIs

### 1. List All Equipment
**Endpoint:** `GET /api/inventory/equipment`

**Query Parameters:**
- `categoryId` (optional): Equipment category ID
- `status` (optional): `available`, `low_stock`, `out_of_stock`, `maintenance`, `retired`
- `q` (optional): Search query
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/inventory/equipment?status=available&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2db7b640a945ff91190e6",
        "name": "Arduino Uno R3",
        "description": "Microcontroller board based on the ATmega328P",
        "categoryId": {
          "_id": "68f2d0db280c3dd85fac353h",
          "name": "Microcontrollers",
          "slug": "microcontrollers"
        },
        "serialNumber": "ARDUINO-001",
        "model": "Uno R3",
        "manufacturer": "Arduino",
        "purchaseDate": "2024-01-01T00:00:00Z",
        "purchasePrice": 25.99,
        "currentValue": 20.00,
        "status": "available",
        "condition": "excellent",
        "location": "Robotics Lab - Shelf A1",
        "quantity": 15,
        "availableQuantity": 12,
        "specifications": {
          "microcontroller": "ATmega328P",
          "operatingVoltage": "5V",
          "digitalPins": 14,
          "analogPins": 6
        },
        "imageUrl": "https://example.com/arduino-uno.jpg",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

### 2. Get Equipment Details
**Endpoint:** `GET /api/inventory/equipment/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment": {
      "_id": "68f2db7b640a945ff91190e6",
      "name": "Arduino Uno R3",
      "description": "Microcontroller board based on the ATmega328P",
      "categoryId": {
        "_id": "68f2d0db280c3dd85fac353h",
        "name": "Microcontrollers",
        "slug": "microcontrollers"
      },
      "serialNumber": "ARDUINO-001",
      "model": "Uno R3",
      "manufacturer": "Arduino",
      "purchaseDate": "2024-01-01T00:00:00Z",
      "purchasePrice": 25.99,
      "currentValue": 20.00,
      "status": "available",
      "condition": "excellent",
      "location": "Robotics Lab - Shelf A1",
      "quantity": 15,
      "availableQuantity": 12,
      "specifications": {
        "microcontroller": "ATmega328P",
        "operatingVoltage": "5V",
        "digitalPins": 14,
        "analogPins": 6,
        "flashMemory": "32KB",
        "sram": "2KB",
        "eeprom": "1KB",
        "clockSpeed": "16MHz"
      },
      "imageUrl": "https://example.com/arduino-uno.jpg",
      "checkoutHistory": [
        {
          "userId": {
            "_id": "68f2d0db280c3dd85fac353d",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com"
          },
          "checkedOutAt": "2024-01-10T10:00:00Z",
          "returnedAt": "2024-01-12T15:00:00Z",
          "purpose": "Project development"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Checkout Equipment
**Endpoint:** `POST /api/inventory/equipment/:id/checkout`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "purpose": "Project development for Smart Agriculture System",
  "expectedReturnDate": "2024-02-15T17:00:00Z",
  "notes": "Need for IoT sensor integration testing"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Equipment checked out successfully",
  "data": {
    "checkout": {
      "_id": "68f2db7b640a945ff91190e7",
      "equipmentId": "68f2db7b640a945ff91190e6",
      "userId": "68f2d0db280c3dd85fac353d",
      "checkedOutAt": "2024-01-15T12:00:00Z",
      "expectedReturnDate": "2024-02-15T17:00:00Z",
      "purpose": "Project development for Smart Agriculture System",
      "notes": "Need for IoT sensor integration testing",
      "status": "checked_out"
    }
  }
}
```

---

## 📧 Newsletter APIs

### 1. Subscribe to Newsletter
**Endpoint:** `POST /api/newsletter/subscribe`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscribed successfully",
  "data": {
    "subscription": {
      "_id": "68f2db7b640a945ff91190e8",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "subscribedAt": "2024-01-15T12:00:00Z",
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

### 2. Check Newsletter Subscription Status
**Endpoint:** `GET /api/newsletter/status/:email`

**Example Request:**
```bash
GET /api/newsletter/status/john.doe@example.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "68f2db7b640a945ff91190e8",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "subscribedAt": "2024-01-15T12:00:00Z",
      "unsubscribedAt": null
    }
  }
}
```

### 3. Unsubscribe from Newsletter
**Endpoint:** `POST /api/newsletter/unsubscribe`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

---

## 👥 Public APIs

### 1. List Lab People
**Endpoint:** `GET /api/public/people`

**Query Parameters:**
- `role` (optional): `team_member`, `mentor`, `researcher`
- `q` (optional): Search query
- `department` (optional): Department filter
- `limit` (optional): 1-100, default: 20
- `skip` (optional): Default: 0

**Example Request:**
```bash
GET /api/public/people?role=mentor&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "68f2d0db280c3dd85fac353f",
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@university.edu",
        "role": "mentor",
        "department": "Computer Science",
        "title": "Associate Professor",
        "bio": "Expert in robotics and artificial intelligence with 15 years of research experience",
        "skills": ["Robotics", "AI", "Machine Learning", "Computer Vision"],
        "profileImageUrl": "https://example.com/sarah-profile.jpg",
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/sarah-johnson",
          "googleScholar": "https://scholar.google.com/citations?user=sarah-johnson"
        },
        "isActive": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 10,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

---

## 📞 Contact APIs

### 1. Submit Contact Form
**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "Inquiry about Robotics Program",
  "message": "I'm interested in joining the robotics program and would like to know more about the requirements and application process.",
  "phone": "+1234567890",
  "organization": "ABC University"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "submission": {
      "_id": "68f2db7b640a945ff91190e9",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "subject": "Inquiry about Robotics Program",
      "message": "I'm interested in joining the robotics program and would like to know more about the requirements and application process.",
      "phone": "+1234567890",
      "organization": "ABC University",
      "status": "new",
      "submittedAt": "2024-01-15T12:00:00Z",
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

## 🔍 Error Responses

### Common Error Formats

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ],
    "code": "VALIDATION_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "AUTHENTICATION_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "error": {
    "message": "Access denied. You can only update your own project requests or need mentor+ privileges",
    "code": "AUTHORIZATION_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": {
    "message": "ProjectRequest not found",
    "code": "NOT_FOUND_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_SERVER_ERROR"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## 📝 Notes

1. **Authentication**: All private endpoints require a valid JWT token in the Authorization header
2. **Pagination**: Most list endpoints support pagination with `limit` and `skip` parameters
3. **Filtering**: Most endpoints support various filtering options via query parameters
4. **Audit Trail**: Project request operations include comprehensive audit logging
5. **Soft Delete**: Deleted project requests are marked as deleted rather than removed from the database
6. **Email Notifications**: Various operations trigger email notifications to relevant users
7. **Rate Limiting**: API endpoints may have rate limiting in production
8. **CORS**: Frontend applications need to handle CORS for cross-origin requests

This documentation covers all the essential APIs that your frontend will need to interact with the Newton Robotics Server backend! 🚀


