# Research Area Admin API Documentation

Complete API documentation for managing Research Areas. Note: Most endpoints require **Mentor+** role, with **DELETE** requiring **Admin** role.

**Base URL:** `/api/research-areas`

---

## 1. List All Research Areas

**Endpoint:** `GET /api/research-areas`

**Access:** Public (Optional Auth)

**Query Parameters:**
- `isActive` (optional, boolean): Filter by active status (default: `true`)
- `isFeatured` (optional, boolean): Filter by featured status
- `category` (optional, string): Filter by category
- `q` (optional, string): Search query (searches in name, description, and keywords)
- `limit` (optional, integer, 1-100): Number of results per page (default: 20)
- `skip` (optional, integer, min: 0): Number of results to skip (default: 0)

**Example Request:**
```bash
GET /api/research-areas?isActive=true&isFeatured=true&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Autonomous Robotics",
        "description": "Research in autonomous navigation and decision-making systems",
        "category": "Robotics",
        "keywords": ["AI", "navigation", "autonomous"],
        "color": "#FF5733",
        "order": 1,
        "isActive": true,
        "isFeatured": true,
        "focusAreas": ["Path Planning", "SLAM", "Computer Vision"],
        "requiredEquipment": ["LiDAR", "Cameras", "GPUs"],
        "requiredSkills": ["Python", "ROS", "Computer Vision"],
        "collaborationOpportunities": "Open to industry partnerships",
        "fundingInfo": "NSF grants available",
        "publicationCount": 5,
        "createdBy": "507f1f77bcf86cd799439012",
        "lastUpdatedBy": "507f1f77bcf86cd799439012",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
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

## 2. Get Research Area by ID

**Endpoint:** `GET /api/research-areas/:id`

**Access:** Public (Optional Auth)

**Path Parameters:**
- `id` (required, string): Research Area ID

**Example Request:**
```bash
GET /api/research-areas/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Autonomous Robotics",
      "description": "Research in autonomous navigation and decision-making systems",
      "category": "Robotics",
      "keywords": ["AI", "navigation", "autonomous"],
      "color": "#FF5733",
      "order": 1,
      "isActive": true,
      "isFeatured": true,
      "focusAreas": ["Path Planning", "SLAM", "Computer Vision"],
      "requiredEquipment": ["LiDAR", "Cameras", "GPUs"],
      "requiredSkills": ["Python", "ROS", "Computer Vision"],
      "collaborationOpportunities": "Open to industry partnerships",
      "fundingInfo": "NSF grants available",
      "publicationCount": 5,
      "studentIds": ["STU001", "STU002", "STU003"],
      "createdBy": "507f1f77bcf86cd799439012",
      "lastUpdatedBy": "507f1f77bcf86cd799439012",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 3. Create Research Area

**Endpoint:** `POST /api/research-areas`

**Access:** Mentor+ (requires authentication token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Autonomous Robotics",                    // Required, 3-200 chars
  "description": "Research in autonomous...",       // Required, 10-2000 chars
  "category": "Robotics",                          // Required, 2-100 chars
  "keywords": ["AI", "navigation", "autonomous"],  // Optional, array of strings (max 100 chars each)
  "color": "#FF5733",                              // Optional, max 7 chars (hex color)
  "order": 1,                                      // Optional, integer >= 0
  "isActive": true,                                // Optional, boolean (default: true)
  "isFeatured": false,                              // Optional, boolean (default: false)
  "featuredImageUrl": "https://...",               // Optional, max 500 chars
  "focusAreas": ["Path Planning", "SLAM"],         // Optional, array of strings (max 200 chars each)
  "requiredEquipment": ["LiDAR", "Cameras"],       // Optional, array of strings (max 200 chars each)
  "requiredSkills": ["Python", "ROS"],            // Optional, array of strings (max 200 chars each)
  "collaborationOpportunities": "Open to...",      // Optional, max 1000 chars
  "fundingInfo": "NSF grants available",           // Optional, max 1000 chars
  "externalLinks": [                               // Optional, array of objects
    {
      "title": "Research Paper",                   // Required, max 100 chars
      "url": "https://...",                        // Required, max 500 chars
      "description": "Link description"            // Optional, max 500 chars
    }
  ],
  "projectCount": 5,                               // Optional, number >= 0
  "publicationCount": 5,                           // Optional, number >= 0
  "memberCount": 3,                                // Optional, number >= 0
  "studentIds": ["STU001", "STU002", "STU003"]    // Optional, array of student IDs (max 50 chars each)
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/research-areas \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Autonomous Robotics",
    "description": "Research in autonomous navigation and decision-making systems for robotics applications",
    "category": "Robotics",
    "keywords": ["AI", "navigation", "autonomous"],
    "color": "#FF5733",
    "order": 1,
    "isActive": true,
    "isFeatured": true,
    "focusAreas": ["Path Planning", "SLAM", "Computer Vision"],
    "requiredEquipment": ["LiDAR", "Cameras", "GPUs"],
    "requiredSkills": ["Python", "ROS", "Computer Vision"],
    "collaborationOpportunities": "Open to industry partnerships",
    "fundingInfo": "NSF grants available",
    "studentIds": ["STU001", "STU002", "STU003"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Research area created",
  "data": {
    "item": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Autonomous Robotics",
      "description": "Research in autonomous navigation and decision-making systems",
      "category": "Robotics",
      "keywords": ["AI", "navigation", "autonomous"],
      "color": "#FF5733",
      "order": 1,
      "isActive": true,
      "isFeatured": true,
      "focusAreas": ["Path Planning", "SLAM", "Computer Vision"],
      "requiredEquipment": ["LiDAR", "Cameras", "GPUs"],
      "requiredSkills": ["Python", "ROS", "Computer Vision"],
      "collaborationOpportunities": "Open to industry partnerships",
      "fundingInfo": "NSF grants available",
      "publicationCount": 0,
      "studentIds": ["STU001", "STU002", "STU003"],
      "createdBy": "507f1f77bcf86cd799439012",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Validation Errors:**
- `name`: Required, must be 3-200 characters
- `description`: Required, must be 10-2000 characters
- `category`: Required, must be 2-100 characters
- `keywords.*`: Each keyword must be max 100 characters
- `color`: Must be max 7 characters
- `order`: Must be integer >= 0
- `featuredImageUrl`: Must be max 500 characters
- `focusAreas.*`: Each focus area must be max 200 characters
- `requiredEquipment.*`: Each equipment must be max 200 characters
- `requiredSkills.*`: Each skill must be max 200 characters
- `collaborationOpportunities`: Max 1000 characters
- `fundingInfo`: Max 1000 characters
- `externalLinks.*.title`: Required, max 100 characters
- `externalLinks.*.url`: Required, max 500 characters
- `externalLinks.*.description`: Max 500 characters
- `projectCount`: Must be number >= 0
- `publicationCount`: Must be number >= 0
- `memberCount`: Must be number >= 0
- `studentIds.*`: Each student ID must be 1-50 characters (trimmed)

---

## 4. Update Research Area

**Endpoint:** `PUT /api/research-areas/:id`

**Access:** Mentor+ (requires authentication token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (required, string): Research Area ID

**Request Body:** (All fields optional, same as POST)

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/research-areas/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isFeatured": true,
    "publicationCount": 10,
    "studentIds": ["STU001", "STU002", "STU004", "STU005"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Research area updated",
  "data": {
    "item": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Autonomous Robotics",
      "description": "Research in autonomous navigation and decision-making systems",
      "category": "Robotics",
      "keywords": ["AI", "navigation", "autonomous"],
      "color": "#FF5733",
      "order": 1,
      "isActive": true,
      "isFeatured": true,
      "focusAreas": ["Path Planning", "SLAM", "Computer Vision"],
      "requiredEquipment": ["LiDAR", "Cameras", "GPUs"],
      "requiredSkills": ["Python", "ROS", "Computer Vision"],
      "collaborationOpportunities": "Open to industry partnerships",
      "fundingInfo": "NSF grants available",
      "publicationCount": 10,
      "studentIds": ["STU001", "STU002", "STU004", "STU005"],
      "createdBy": "507f1f77bcf86cd799439012",
      "lastUpdatedBy": "507f1f77bcf86cd799439012",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
    }
  }
}
```

---

## 5. Delete Research Area

**Endpoint:** `DELETE /api/research-areas/:id`

**Access:** Admin Only (requires authentication token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Path Parameters:**
- `id` (required, string): Research Area ID

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/research-areas/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Research area deleted"
}
```

**Error Responses:**
- `404`: Research area not found
- `403`: Forbidden (not admin)

---

## 6. Get All Categories

**Endpoint:** `GET /api/research-areas/categories`

**Access:** Public (Optional Auth)

**Example Request:**
```bash
GET /api/research-areas/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      "AI & Machine Learning",
      "Robotics",
      "Computer Vision",
      "Embedded Systems"
    ]
  }
}
```

---

## Data Model

### ResearchArea Schema

```typescript
{
  name: string;                    // Required, 3-200 chars
  description: string;              // Required, 10-2000 chars
  category: string;                 // Required, 2-100 chars
  keywords?: string[];              // Optional, array of strings (max 100 chars each)
  color?: string;                   // Optional, max 7 chars (hex color)
  order?: number;                   // Optional, integer >= 0 (default: 0)
  isActive?: boolean;               // Optional, default: true
  isFeatured?: boolean;            // Optional, default: false
  featuredImageUrl?: string;       // Optional, max 500 chars
  focusAreas?: string[];           // Optional, array of strings (max 200 chars each)
  requiredEquipment?: string[];    // Optional, array of strings (max 200 chars each)
  requiredSkills?: string[];       // Optional, array of strings (max 200 chars each)
  collaborationOpportunities?: string;  // Optional, max 1000 chars
  fundingInfo?: string;            // Optional, max 1000 chars
  externalLinks?: Array<{          // Optional, array of objects
    title: string;                  // Required, max 100 chars
    url: string;                    // Required, max 500 chars
    description?: string;           // Optional, max 500 chars
  }>;
  projectCount?: number;           // Optional, number >= 0 (default: 0)
  publicationCount?: number;       // Optional, number >= 0 (default: 0)
  memberCount?: number;            // Optional, number >= 0 (default: 0)
  studentIds?: string[];          // Optional, array of student IDs (max 50 chars each)
  createdBy?: ObjectId;            // Auto-set on creation (required)
  lastUpdatedBy?: ObjectId;        // Auto-set on update
  createdAt?: Date;                // Auto-set
  updatedAt?: Date;                // Auto-set
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Name must be between 3 and 200 characters"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Research Area not found"
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

## Summary Table

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/research-areas` | Public | List all research areas with filters |
| GET | `/api/research-areas/:id` | Public | Get research area by ID |
| POST | `/api/research-areas` | Mentor+ | Create new research area |
| PUT | `/api/research-areas/:id` | Mentor+ | Update research area |
| DELETE | `/api/research-areas/:id` | Admin | Delete research area |
| GET | `/api/research-areas/categories` | Public | Get all categories |

---

## Notes

1. **Authentication**: All write operations (POST, PUT, DELETE) require authentication. Use `Authorization: Bearer <token>` header.

2. **Role Requirements**:
   - **Mentor+**: Can create and update research areas
   - **Admin**: Can delete research areas
   - **Public**: Can read/list research areas

3. **Search**: The `q` parameter searches across:
   - Research area name
   - Description
   - Keywords (array)

4. **Sorting**: Results are sorted by `order` (ascending), then by `name` (ascending).

5. **Pagination**: Use `limit` and `skip` for pagination. The response includes pagination metadata.

6. **Auto-fields**: `createdBy` and `lastUpdatedBy` are automatically set based on the authenticated user.

