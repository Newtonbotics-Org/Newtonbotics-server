# News API - Request & Response Examples

This document provides comprehensive examples for creating and updating news articles with application forms.

## 📋 CREATE NEWS REQUEST & RESPONSE

### **POST /api/news/admin** - Create News Article

#### **Request Body Example**
```json
{
  "title": "Advanced Robotics Workshop 2024",
  "content": "Join our comprehensive robotics workshop covering Arduino programming, sensor integration, and autonomous navigation. This hands-on workshop is perfect for beginners and intermediate students interested in robotics and automation.",
  "excerpt": "Learn robotics fundamentals with hands-on Arduino projects and real-world applications",
  "authorId": "68a30681af3f3b7d9e2653a3",
  "categoryId": "68a30681af3f3b7d9e2653a4",
  "isPublished": true,
  "isFeatured": true,
  "tags": ["robotics", "workshop", "arduino", "hands-on", "automation"],
  "featuredImageUrl": "https://example.com/images/robotics-workshop.jpg",
  "featureOptions": {
    "showInNav": true,
    "navLabel": "Robotics Workshop",
    "navOrder": 1
  },
  "application": {
    "isEnabled": true,
    "type": "workshop",
    "requireLogin": false,
    "formApplyStartDate": "2025-09-01T00:00:00.000Z",
    "formApplyLastDate": "2025-09-15T23:59:59.000Z",
    "maxApplicants": 25,
    "formLink": "https://forms.example.com/robotics-workshop",
    "targetType": "Workshop",
    "targetId": "68a30681af3f3b7d9e2653a5"
  }
}
```

#### **Success Response (201)**
```json
{
  "success": true,
  "message": "News article created successfully",
  "data": {
    "item": {
      "_id": "68b3721b80b1dec1edceaae9",
      "title": "Advanced Robotics Workshop 2024",
      "content": "Join our comprehensive robotics workshop covering Arduino programming, sensor integration, and autonomous navigation. This hands-on workshop is perfect for beginners and intermediate students interested in robotics and automation.",
      "excerpt": "Learn robotics fundamentals with hands-on Arduino projects and real-world applications",
      "authorId": "68a30681af3f3b7d9e2653a3",
      "categoryId": "68a30681af3f3b7d9e2653a4",
      "isPublished": true,
      "isFeatured": true,
      "tags": ["robotics", "workshop", "arduino", "hands-on", "automation"],
      "featuredImageUrl": "https://example.com/images/robotics-workshop.jpg",
      "featureOptions": {
        "showInNav": true,
        "navLabel": "Robotics Workshop",
        "navOrder": 1
      },
      "application": {
        "isEnabled": true,
        "type": "workshop",
        "requireLogin": false,
        "formApplyStartDate": "2025-09-01T00:00:00.000Z",
        "formApplyLastDate": "2025-09-15T23:59:59.000Z",
        "maxApplicants": 25,
        "formLink": "https://forms.example.com/robotics-workshop",
        "status": "not_started",
        "targetType": "Workshop",
        "targetId": "68a30681af3f3b7d9e2653a5"
      },
      "createdAt": "2025-08-30T21:50:19.029Z",
      "updatedAt": "2025-08-30T21:50:19.029Z"
    }
  }
}
```

#### **Error Response (400) - Validation Error**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title must be at least 5 characters long"
      },
      {
        "field": "application.formApplyStartDate",
        "message": "Invalid date format"
      }
    ]
  }
}
```

---

## 📝 UPDATE NEWS REQUEST & RESPONSE

### **PUT /api/news/admin/:id** - Update News Article

#### **Request Body Example (Full Update)**
```json
{
  "title": "Updated Robotics Workshop 2024",
  "content": "Updated content for the robotics workshop with new curriculum and advanced topics.",
  "excerpt": "Updated excerpt for the workshop",
  "isFeatured": false,
  "tags": ["robotics", "workshop", "arduino", "advanced"],
  "featureOptions": {
    "showInNav": false,
    "navOrder": 2
  },
  "application": {
    "isEnabled": true,
    "type": "competition",
    "requireLogin": true,
    "formApplyStartDate": "2025-09-10T00:00:00.000Z",
    "formApplyLastDate": "2025-09-20T23:59:59.000Z",
    "maxApplicants": 50,
    "formLink": "https://forms.example.com/robotics-competition",
    "targetType": "Competition",
    "targetId": "68a30681af3f3b7d9e2653a6"
  }
}
```

#### **Request Body Example (Partial Update)**
```json
{
  "title": "Updated Title Only",
  "application": {
    "formApplyStartDate": "2025-09-05T00:00:00.000Z",
    "formApplyLastDate": "2025-09-25T23:59:59.000Z",
    "formLink": "https://forms.example.com/updated-workshop"
  }
}
```

#### **Success Response (200)**
```json
{
  "success": true,
  "message": "News article updated successfully",
  "data": {
    "item": {
      "_id": "68b3721b80b1dec1edceaae9",
      "title": "Updated Robotics Workshop 2024",
      "content": "Updated content for the robotics workshop with new curriculum and advanced topics.",
      "excerpt": "Updated excerpt for the workshop",
      "authorId": "68a30681af3f3b7d9e2653a3",
      "categoryId": "68a30681af3f3b7d9e2653a4",
      "isPublished": true,
      "isFeatured": false,
      "tags": ["robotics", "workshop", "arduino", "advanced"],
      "featuredImageUrl": "https://example.com/images/robotics-workshop.jpg",
      "featureOptions": {
        "showInNav": false,
        "navLabel": "Robotics Workshop",
        "navOrder": 2
      },
      "application": {
        "isEnabled": true,
        "type": "competition",
        "requireLogin": true,
        "formApplyStartDate": "2025-09-10T00:00:00.000Z",
        "formApplyLastDate": "2025-09-20T23:59:59.000Z",
        "maxApplicants": 50,
        "formLink": "https://forms.example.com/robotics-competition",
        "status": "not_started",
        "targetType": "Competition",
        "targetId": "68a30681af3f3b7d9e2653a6"
      },
      "updatedAt": "2025-08-30T21:50:23.362Z"
    }
  }
}
```

#### **Error Response (404) - Not Found**
```json
{
  "success": false,
  "error": {
    "message": "News article not found"
  }
}
```

#### **Error Response (400) - Validation Error**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "application.formApplyLastDate",
        "message": "End date must be after start date"
      }
    ]
  }
}
```

---

## 🔧 FIELD REFERENCE

### **Required Fields for Create**
```json
{
  "title": "string (5-255 chars)",
  "content": "string (20-10000 chars)",
  "authorId": "string (ObjectId)"
}
```

### **Optional Fields**
```json
{
  "excerpt": "string (max 500 chars)",
  "categoryId": "string (ObjectId)",
  "isPublished": "boolean",
  "isFeatured": "boolean",
  "publishedAt": "ISO8601 date",
  "tags": "array of strings",
  "featuredImageUrl": "string (max 500 chars)",
  "featureOptions": {
    "showInNav": "boolean",
    "navOrder": "integer (min 0)",
    "navLabel": "string (max 50 chars)"
  },
  "application": {
    "isEnabled": "boolean",
    "type": "enum: ['workshop', 'event', 'competition', 'other']",
    "requireLogin": "boolean",
    "formApplyStartDate": "ISO8601 date",
    "formApplyLastDate": "ISO8601 date",
    "maxApplicants": "integer (min 1)",
    "formLink": "string (max 500 chars)",
    "targetType": "enum: ['Workshop', 'Event', 'Competition', 'Other']",
    "targetId": "string (ObjectId)"
  }
}
```

---

## 📊 STATUS EXAMPLES

### **Active Application**
```json
{
  "application": {
    "isEnabled": true,
    "formApplyStartDate": "2025-08-30T00:00:00.000Z",
    "formApplyLastDate": "2025-09-30T23:59:59.000Z",
    "status": "active"
  }
}
```

### **Expired Application**
```json
{
  "application": {
    "isEnabled": true,
    "formApplyStartDate": "2025-08-01T00:00:00.000Z",
    "formApplyLastDate": "2025-08-15T23:59:59.000Z",
    "status": "expired"
  }
}
```

### **Not Started Application**
```json
{
  "application": {
    "isEnabled": true,
    "formApplyStartDate": "2025-09-15T00:00:00.000Z",
    "formApplyLastDate": "2025-10-15T23:59:59.000Z",
    "status": "not_started"
  }
}
```

---

## 🚀 QUICK EXAMPLES

### **Minimal Create Request**
```json
{
  "title": "Simple News Article",
  "content": "This is a simple news article with basic content.",
  "authorId": "68a30681af3f3b7d9e2653a3"
}
```

### **Minimal Update Request**
```json
{
  "title": "Updated Title"
}
```

### **Application Only Update**
```json
{
  "application": {
    "isEnabled": true,
    "formApplyStartDate": "2025-09-01T00:00:00.000Z",
    "formApplyLastDate": "2025-09-30T23:59:59.000Z",
    "formLink": "https://forms.example.com/simple-form"
  }
}
```

---

## 3. Apply to News Article

### Request Body Example

```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890"
}
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Application submitted",
  "data": {
    "application": {
      "_id": "68b3721c80b1dec1edceaaf1",
      "newsId": "68b3721b80b1dec1edceaae9",
      "type": "workshop",
      "applicant": {
        "userId": "68a30681af3f3b7d9e2653a3",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890"
      },
      "responses": [],
      "status": "submitted",
      "submittedAt": "2025-08-30T21:50:20.028Z"
    }
  }
}
```

### Error Response - Expired Application (400)

```json
{
  "success": false,
  "error": {
    "message": "Application deadline has passed."
  }
}
```

### Error Response - Not Started (400)

```json
{
  "success": false,
  "error": {
    "message": "Applications have not started yet."
  }
}
```

## 4. Get Application Status

### Request
```
GET /api/news/68b3721b80b1dec1edceaae9/application-status
Authorization: Bearer <token>
```

### Success Response (200) - Not Applied

```json
{
  "success": true,
  "data": {
    "hasApplied": false,
    "canApply": true,
    "reason": null
  }
}
```

### Success Response (200) - Already Applied

```json
{
  "success": true,
  "data": {
    "hasApplied": true,
    "canApply": false,
    "reason": "Already applied",
    "application": {
      "id": "68b3721c80b1dec1edceaaf1",
      "status": "accepted",
      "submittedAt": "2025-08-30T21:50:20.028Z",
      "reviewedAt": "2025-08-30T21:50:23.362Z",
      "notes": "Excellent background and motivation. Welcome to the workshop!"
    }
  }
}
```

### Success Response (200) - Expired Application

```json
{
  "success": true,
  "data": {
    "hasApplied": false,
    "canApply": false,
    "reason": "Application deadline has passed"
  }
}
```

## 5. Get Applications (Admin/Mentor)

### Request
```
GET /api/news/68b3721b80b1dec1edceaae9/applications?status=accepted&limit=10
Authorization: Bearer <token>
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "68b3721c80b1dec1edceaaf1",
        "newsId": "68b3721b80b1dec1edceaae9",
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
        "responses": [],
        "status": "accepted",
        "submittedAt": "2025-08-30T21:50:20.028Z",
        "reviewedAt": "2025-08-30T21:50:23.362Z",
        "reviewerId": "68a30681af3f3b7d9e2653a3",
        "notes": "Excellent background and motivation. Welcome to the workshop!"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "skip": 0,
      "hasMore": false
    }
  }
}
```

## 6. Update Application Status

### Request Body Example

```json
{
  "status": "accepted",
  "notes": "Excellent background and motivation. Welcome to the workshop!"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {
    "application": {
      "_id": "68b3721c80b1dec1edceaaf1",
      "status": "accepted",
      "reviewedAt": "2025-08-30T22:00:00.000Z",
      "reviewerId": "68a30681af3f3b7d9e2653a3",
      "notes": "Excellent background and motivation. Welcome to the workshop!"
    }
  }
}
```

## Key Features Added

### ✅ **New Application Fields**
- **formApplyStartDate**: When applications can start being submitted
- **formApplyLastDate**: When applications close (deadline)
- **formLink**: External form link for applications
- **status**: Auto-calculated status based on current date

### ✅ **Auto-Calculated Status**
- **active**: Current date is between start and end dates
- **expired**: Current date is after end date
- **not_started**: Current date is before start date

### ✅ **Simplified Application Process**
- **No form fields**: Removed complex form field configuration
- **External forms**: Users are directed to external form links
- **Basic info**: Only name, email, and phone required

### ✅ **Smart Validation**
- **Status-based**: Applications rejected based on calculated status
- **Deadline enforcement**: Automatic expiration handling
- **Capacity management**: Max applicants limit enforcement
- **Role-based access**: Admin/Mentor/User permissions

### ✅ **Real-time Status Updates**
- **Pre-save middleware**: Status calculated on save
- **Pre-find middleware**: Status updated for existing documents
- **Automatic expiration**: No manual intervention needed

## Status Logic

```javascript
// Status calculation logic
if (!startDate || !lastDate) {
  status = 'not_started';
} else if (now < startDate) {
  status = 'not_started';
} else if (now > lastDate) {
  status = 'expired';
} else {
  status = 'active';
}
```

This comprehensive API system provides everything needed for managing news articles with application forms, from creation to final decision making, with automatic status management!
