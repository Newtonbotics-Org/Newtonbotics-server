# Media Admin API Documentation

This document provides comprehensive API endpoints for managing media files, media categories, and media collections in the Newton Robotics Server system.

## Overview

The media management system provides:
- **Media File Management**: Upload, view, update, and delete media files
- **Category Management**: Organize media into hierarchical categories
- **Collection Management**: Group related media files together
- **Search and Filtering**: Find media by type, category, or search terms
- **Analytics**: Track view counts and media usage

## Authentication

All admin endpoints require authentication with a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role Requirements

- **Team Member+**: Create and update media files, categories, collections
- **Mentor+**: Delete media files and categories
- **Admin**: Full access to all operations
- **Public**: View media files and categories (optional authentication)

---

## Media Files Management

### 1. List Media Files

**Endpoint:** `GET /api/media`

**Access:** Public (optional authentication)

**Query Parameters:**
- `fileType` (optional): Filter by file type - `image`, `video`, `document`, `audio`
- `categoryId` (optional): Filter by category ID
- `q` (optional): Search query (searches title)
- `limit` (optional): Number of results per page (1-100, default: 20)
- `skip` (optional): Number of results to skip for pagination (default: 0)

**Example Request:**
```bash
GET /api/media?fileType=image&categoryId=64a1b2c3d4e5f6789012345&limit=10&skip=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Project Demo Video",
        "description": "Demonstration of our latest robotics project",
        "fileUrl": "https://example.com/videos/demo.mp4",
        "thumbnailUrl": "https://example.com/thumbnails/demo.jpg",
        "fileType": "video",
        "fileSize": 15728640,
        "dimensions": "1920x1080",
        "duration": 120,
        "categoryId": "64a1b2c3d4e5f6789012346",
        "uploadedBy": "64a1b2c3d4e5f6789012347",
        "tags": ["robotics", "demo", "project"],
        "isFeatured": true,
        "viewCount": 45,
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

### 2. Get Media File Details

**Endpoint:** `GET /api/media/:id`

**Access:** Public (optional authentication)

**Path Parameters:**
- `id` (required): Media file ID

**Example Request:**
```bash
GET /api/media/64a1b2c3d4e5f6789012345
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Project Demo Video",
      "description": "Demonstration of our latest robotics project",
      "fileUrl": "https://example.com/videos/demo.mp4",
      "thumbnailUrl": "https://example.com/thumbnails/demo.jpg",
      "fileType": "video",
      "fileSize": 15728640,
      "dimensions": "1920x1080",
      "duration": 120,
      "categoryId": "64a1b2c3d4e5f6789012346",
      "uploadedBy": "64a1b2c3d4e5f6789012347",
      "tags": ["robotics", "demo", "project"],
      "isFeatured": true,
      "viewCount": 45,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Note:** This endpoint automatically increments the view count.

### 3. Create Media File

**Endpoint:** `POST /api/media`

**Access:** Team Member+ (requires authentication)

**Required Fields:**
- `title` (string, 2-255 characters)
- `fileUrl` (string)
- `fileType` (enum: `image`, `video`, `document`, `audio`)
- `uploadedBy` (string - user ID)

**Optional Fields:**
- `description` (string, max 2000 characters)
- `thumbnailUrl` (string, max 500 characters)
- `fileSize` (number)
- `dimensions` (string, max 50 characters)
- `duration` (number for videos/audio)
- `categoryId` (ObjectId reference to MediaCategory)
- `tags` (array of strings, max 100 characters each)
- `isFeatured` (boolean, default: false)

**Example Request:**
```bash
POST /api/media
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Project Image",
  "description": "Latest project showcase image",
  "fileUrl": "https://example.com/images/project.jpg",
  "thumbnailUrl": "https://example.com/thumbnails/project.jpg",
  "fileType": "image",
  "fileSize": 2048576,
  "dimensions": "1920x1080",
  "categoryId": "64a1b2c3d4e5f6789012346",
  "uploadedBy": "64a1b2c3d4e5f6789012347",
  "tags": ["project", "showcase", "image"],
  "isFeatured": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Media created",
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f6789012348",
      "title": "New Project Image",
      "description": "Latest project showcase image",
      "fileUrl": "https://example.com/images/project.jpg",
      "thumbnailUrl": "https://example.com/thumbnails/project.jpg",
      "fileType": "image",
      "fileSize": 2048576,
      "dimensions": "1920x1080",
      "categoryId": "64a1b2c3d4e5f6789012346",
      "uploadedBy": "64a1b2c3d4e5f6789012347",
      "tags": ["project", "showcase", "image"],
      "isFeatured": false,
      "viewCount": 0,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### 4. Update Media File

**Endpoint:** `PUT /api/media/:id`

**Access:** Team Member+ (requires authentication)

**Path Parameters:**
- `id` (required): Media file ID

**Body:** Any updatable fields from the Media model

**Example Request:**
```bash
PUT /api/media/64a1b2c3d4e5f6789012348
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Project Image",
  "description": "Updated description for the project image",
  "isFeatured": true,
  "tags": ["project", "showcase", "image", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Media updated",
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f6789012348",
      "title": "Updated Project Image",
      "description": "Updated description for the project image",
      "fileUrl": "https://example.com/images/project.jpg",
      "thumbnailUrl": "https://example.com/thumbnails/project.jpg",
      "fileType": "image",
      "fileSize": 2048576,
      "dimensions": "1920x1080",
      "categoryId": "64a1b2c3d4e5f6789012346",
      "uploadedBy": "64a1b2c3d4e5f6789012347",
      "tags": ["project", "showcase", "image", "updated"],
      "isFeatured": true,
      "viewCount": 0,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:15:00.000Z"
    }
  }
}
```

### 5. Delete Media File

**Endpoint:** `DELETE /api/media/:id`

**Access:** Mentor+ (requires authentication)

**Path Parameters:**
- `id` (required): Media file ID

**Example Request:**
```bash
DELETE /api/media/64a1b2c3d4e5f6789012348
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Media deleted"
}
```

### 6. Increment View Count

**Endpoint:** `POST /api/media/:id/view`

**Access:** Public (optional authentication)

**Path Parameters:**
- `id` (required): Media file ID

**Example Request:**
```bash
POST /api/media/64a1b2c3d4e5f6789012345/view
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "View count updated",
  "data": {
    "viewCount": 46
  }
}
```

---

## Media Categories Management

### 1. List Media Categories

**Endpoint:** `GET /api/media/categories`

**Access:** Public (optional authentication)

**Example Request:**
```bash
GET /api/media/categories
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "Project Showcase",
        "description": "Images and videos showcasing our projects",
        "parentCategoryId": null,
        "createdAt": "2024-01-15T09:00:00.000Z",
        "updatedAt": "2024-01-15T09:00:00.000Z"
      },
      {
        "_id": "64a1b2c3d4e5f6789012349",
        "name": "Tutorial Videos",
        "description": "Educational content and tutorials",
        "parentCategoryId": "64a1b2c3d4e5f6789012346",
        "createdAt": "2024-01-15T09:30:00.000Z",
        "updatedAt": "2024-01-15T09:30:00.000Z"
      }
    ]
  }
}
```

### 2. Create Media Category

**Endpoint:** `POST /api/media/categories`

**Access:** Team Member+ (requires authentication)

**Required Fields:**
- `name` (string, 2-100 characters)

**Optional Fields:**
- `description` (string, max 1000 characters)
- `parentCategoryId` (ObjectId for hierarchical categories)

**Example Request:**
```bash
POST /api/media/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Event Photos",
  "description": "Photos from club events and competitions",
  "parentCategoryId": "64a1b2c3d4e5f6789012346"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f678901234a",
      "name": "Event Photos",
      "description": "Photos from club events and competitions",
      "parentCategoryId": "64a1b2c3d4e5f6789012346",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### 3. Update Media Category

**Endpoint:** `PUT /api/media/categories/:id`

**Access:** Team Member+ (requires authentication)

**Path Parameters:**
- `id` (required): Category ID

**Body:** Any updatable fields from the MediaCategory model

**Example Request:**
```bash
PUT /api/media/categories/64a1b2c3d4e5f678901234a
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Event Gallery",
  "description": "Updated description for event photos and videos"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category updated",
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f678901234a",
      "name": "Event Gallery",
      "description": "Updated description for event photos and videos",
      "parentCategoryId": "64a1b2c3d4e5f6789012346",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:15:00.000Z"
    }
  }
}
```

### 4. Delete Media Category

**Endpoint:** `DELETE /api/media/categories/:id`

**Access:** Mentor+ (requires authentication)

**Path Parameters:**
- `id` (required): Category ID

**Example Request:**
```bash
DELETE /api/media/categories/64a1b2c3d4e5f678901234a
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Category deleted"
}
```

---

## Media Collections Management

### 1. List Media Collections

**Endpoint:** `GET /api/media/collections`

**Access:** Public (optional authentication)

**Example Request:**
```bash
GET /api/media/collections
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64a1b2c3d4e5f678901234b",
        "name": "Robotics Competition 2024",
        "description": "All media from the 2024 robotics competition",
        "coverMediaId": "64a1b2c3d4e5f6789012345",
        "isPublic": true,
        "createdBy": "64a1b2c3d4e5f6789012347",
        "mediaItems": [
          "64a1b2c3d4e5f6789012345",
          "64a1b2c3d4e5f6789012348"
        ],
        "createdAt": "2024-01-15T13:00:00.000Z",
        "updatedAt": "2024-01-15T13:00:00.000Z"
      }
    ]
  }
}
```

### 2. Create Media Collection

**Endpoint:** `POST /api/media/collections`

**Access:** Team Member+ (requires authentication)

**Required Fields:**
- `name` (string, 2-255 characters)

**Optional Fields:**
- `description` (string)
- `coverMediaId` (ObjectId)
- `isPublic` (boolean)
- `mediaItems` (array of media IDs)

**Example Request:**
```bash
POST /api/media/collections
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Portfolio 2024",
  "description": "Collection of our best projects from 2024",
  "coverMediaId": "64a1b2c3d4e5f6789012345",
  "isPublic": true,
  "mediaItems": [
    "64a1b2c3d4e5f6789012345",
    "64a1b2c3d4e5f6789012348"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collection created",
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f678901234c",
      "name": "Project Portfolio 2024",
      "description": "Collection of our best projects from 2024",
      "coverMediaId": "64a1b2c3d4e5f6789012345",
      "isPublic": true,
      "createdBy": "64a1b2c3d4e5f6789012347",
      "mediaItems": [
        "64a1b2c3d4e5f6789012345",
        "64a1b2c3d4e5f6789012348"
      ],
      "createdAt": "2024-01-15T14:00:00.000Z",
      "updatedAt": "2024-01-15T14:00:00.000Z"
    }
  }
}
```

---

## Data Models

### Media Model

```javascript
{
  _id: ObjectId,
  title: String (required, max 255 chars),
  description: String (max 2000 chars),
  fileUrl: String (required, max 500 chars),
  thumbnailUrl: String (max 500 chars),
  fileType: String (required, enum: ['image', 'video', 'document', 'audio']),
  fileSize: Number (min 0),
  dimensions: String (max 50 chars),
  duration: Number (min 0),
  categoryId: ObjectId (ref: 'MediaCategory'),
  uploadedBy: ObjectId (required, ref: 'User'),
  tags: [String] (max 100 chars each),
  isFeatured: Boolean (default: false),
  viewCount: Number (default: 0, min: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### MediaCategory Model

```javascript
{
  _id: ObjectId,
  name: String (required, max 100 chars),
  description: String (max 1000 chars),
  parentCategoryId: ObjectId (ref: 'MediaCategory'),
  createdAt: Date,
  updatedAt: Date
}
```

### MediaCollection Model

```javascript
{
  _id: ObjectId,
  name: String (required, max 255 chars),
  description: String,
  coverMediaId: ObjectId,
  isPublic: Boolean,
  createdBy: ObjectId (ref: 'User'),
  mediaItems: [ObjectId] (ref: 'Media'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be between 2 and 255 characters"
    }
  ]
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "Media not found"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions"
}
```

---

## Usage Examples

### Upload and Organize Media

1. **Create a category:**
```bash
POST /api/media/categories
{
  "name": "Project Documentation",
  "description": "Technical documentation and diagrams"
}
```

2. **Upload media file:**
```bash
POST /api/media
{
  "title": "System Architecture Diagram",
  "fileUrl": "https://example.com/docs/architecture.png",
  "fileType": "image",
  "categoryId": "64a1b2c3d4e5f6789012346",
  "uploadedBy": "64a1b2c3d4e5f6789012347"
}
```

3. **Create a collection:**
```bash
POST /api/media/collections
{
  "name": "Project Documentation Set",
  "description": "Complete documentation for the project",
  "mediaItems": ["64a1b2c3d4e5f6789012348"]
}
```

### Search and Filter Media

1. **Find all images in a category:**
```bash
GET /api/media?fileType=image&categoryId=64a1b2c3d4e5f6789012346
```

2. **Search for specific content:**
```bash
GET /api/media?q=robotics&limit=10
```

3. **Get paginated results:**
```bash
GET /api/media?limit=5&skip=10
```

---

## Best Practices

1. **File Organization**: Use hierarchical categories to organize media logically
2. **Metadata**: Always provide descriptive titles and descriptions
3. **Tags**: Use consistent tagging conventions for better searchability
4. **File Types**: Ensure file URLs are accessible and file types are correctly specified
5. **Permissions**: Respect role-based access control for different operations
6. **Collections**: Use collections to group related media for presentations or portfolios
7. **Analytics**: Monitor view counts to understand popular content
8. **Cleanup**: Regularly review and remove outdated or unused media files

---

## Rate Limits and Performance

- **List endpoints**: Pagination is enforced (max 100 items per request)
- **Search**: Case-insensitive regex search on titles
- **View counting**: Optimized with non-blocking updates
- **File uploads**: Handle large files appropriately (consider file size limits)
- **Caching**: Consider implementing caching for frequently accessed media lists

---

## Security Considerations

1. **File URLs**: Ensure uploaded files are properly secured and accessible
2. **Authentication**: All modification operations require valid authentication
3. **Authorization**: Role-based access control prevents unauthorized operations
4. **Input Validation**: All inputs are validated to prevent injection attacks
5. **File Types**: Only specified file types are allowed
6. **Size Limits**: File size and dimension limits are enforced

