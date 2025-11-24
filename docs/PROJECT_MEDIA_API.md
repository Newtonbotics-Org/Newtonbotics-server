# Project Media Management API

This document provides the API endpoints for managing project media (images, videos, GitHub links, and documentation) for team leaders.

## Base URLs
```
Project Media URLs: http://localhost:3005/api/projects
Media Files:        http://localhost:3005/api/media
```

## Authentication
All endpoints require authentication:
```
Authorization: Bearer <jwt_token>
```

---

## Overview

Team leaders (project leaders) have full access to manage media for their projects. This includes:

### Project Media URLs
- Update project image URLs
- Add/update video URLs (YouTube, Vimeo, Dailymotion)
- Link GitHub repositories
- Add documentation URLs

### Media Files Management
- Create media files (images, videos, documents, audio)
- Update media files
- Delete media files
- Manage media categories and collections

**Access Control:** 
- **Project Media URLs:** Only project leaders (team members who are leaders of the project), mentors, or admins can update project media URLs.
- **Media Files:** Project leaders (any project), media owners, mentors, or admins can manage media files.

---

## Endpoints

### 1. Update Project Media

**Endpoint:** `PUT /api/projects/:id/media`

**Description:** Update media URLs for a project. Team leaders can update all or specific media fields.

**Access:** Project Leader, Mentor, or Admin

**Path Parameters:**
- `id` (string, required): Project ID

**Request Body:**
All fields are optional. You can update any combination of media fields.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|-------------|
| `imageUrl` | string | No | Project image URL | Must be a valid image URL ending with .jpg, .jpeg, .png, .gif, or .webp |
| `videoUrl` | string | No | Project video URL | Must be from YouTube, Vimeo, or Dailymotion |
| `githubUrl` | string | No | GitHub repository URL | Must be a valid GitHub repository URL |
| `documentationUrl` | string | No | Documentation URL | Must be a valid URL |

**URL Format Requirements:**
- **Image URLs:** Must match pattern: `https?://.+\.(jpg|jpeg|png|gif|webp)$` (case-insensitive)
- **Video URLs:** Must be from:
  - YouTube: `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`
  - Vimeo: `https://vimeo.com/...`
  - Dailymotion: `https://dailymotion.com/...`
- **GitHub URLs:** Must match pattern: `https?://(www\.)?github\.com/.+`
- **Documentation URLs:** Must be a valid HTTP/HTTPS URL

**Note:** To clear a field, send an empty string (`""`). The field will be set to `null`.

---

## Request Examples

### Example 1: Update All Media Fields

```bash
PUT /api/projects/68f3d44daae2b97eb7be7571/media
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "https://example.com/images/project-showcase.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "githubUrl": "https://github.com/username/project-repo",
  "documentationUrl": "https://docs.example.com/project-docs"
}
```

### Example 2: Update Only Image URL

```bash
PUT /api/projects/68f3d44daae2b97eb7be7571/media
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "https://example.com/images/new-project-image.png"
}
```

### Example 3: Update Multiple Fields

```bash
PUT /api/projects/68f3d44daae2b97eb7be7571/media
Authorization: Bearer <token>
Content-Type: application/json

{
  "videoUrl": "https://vimeo.com/123456789",
  "githubUrl": "https://github.com/user/new-repo"
}
```

### Example 4: Clear a Field

```bash
PUT /api/projects/68f3d44daae2b97eb7be7571/media
Authorization: Bearer <token>
Content-Type: application/json

{
  "videoUrl": ""
}
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Project media updated successfully",
  "data": {
    "project": {
      "_id": "68f3d44daae2b97eb7be7571",
      "title": "Autonomous Drone",
      "description": "Project description...",
      "imageUrl": "https://example.com/images/project-showcase.jpg",
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "githubUrl": "https://github.com/username/project-repo",
      "documentationUrl": "https://docs.example.com/project-docs",
      "teamLeaderId": {
        "_id": "68f3ce7c10e6eb3ccbb85979",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "mentorId": {
        "_id": "68f3ce7c10e6eb3ccbb85980",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com"
      },
      "teamMembers": [...],
      "status": "ongoing",
      "category": "Robotics, AI",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T11:30:00.000Z"
    },
    "media": {
      "imageUrl": "https://example.com/images/project-showcase.jpg",
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "githubUrl": "https://github.com/username/project-repo",
      "documentationUrl": "https://docs.example.com/project-docs"
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "imageUrl",
          "message": "Image must be a valid image URL"
        }
      ]
    }
  },
  "timestamp": "2025-01-15T12:00:00.000Z",
  "path": "/api/projects/68f3d44daae2b97eb7be7571/media",
  "method": "PUT"
}
```

#### 400 Bad Request - No Fields Provided

```json
{
  "success": false,
  "message": "No media fields provided for update"
}
```

#### 401 Unauthorized - Missing/Invalid Token

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "details": {
      "statusCode": 401,
      "isOperational": true
    }
  }
}
```

#### 403 Forbidden - Access Denied

```json
{
  "success": false,
  "error": {
    "message": "Access denied. You must be a team member and project leader, or a mentor/admin to manage this project",
    "details": {
      "statusCode": 403,
      "isOperational": true
    }
  }
}
```

#### 404 Not Found - Project Not Found

```json
{
  "success": false,
  "error": {
    "message": "Project not found",
    "details": {
      "statusCode": 404,
      "isOperational": true
    }
  }
}
```

---

## Frontend Implementation Guide

### JavaScript/TypeScript Example

```typescript
interface ProjectMedia {
  imageUrl?: string;
  videoUrl?: string;
  githubUrl?: string;
  documentationUrl?: string;
}

async function updateProjectMedia(
  projectId: string,
  media: ProjectMedia,
  token: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(
      `http://localhost:3005/api/projects/${projectId}/media`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(media),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || data.message || 'Failed to update media',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Usage example
const mediaUpdate = {
  imageUrl: 'https://example.com/images/project.jpg',
  videoUrl: 'https://www.youtube.com/watch?v=example',
  githubUrl: 'https://github.com/user/repo',
  documentationUrl: 'https://docs.example.com',
};

const result = await updateProjectMedia(
  '68f3d44daae2b97eb7be7571',
  mediaUpdate,
  userToken
);

if (result.success) {
  console.log('Media updated:', result.data.media);
} else {
  console.error('Error:', result.error);
}
```

### React Hook Example

```typescript
import { useState } from 'react';

interface UseProjectMediaReturn {
  updateMedia: (media: ProjectMedia) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

function useProjectMedia(projectId: string, token: string): UseProjectMediaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateMedia = async (media: ProjectMedia) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `http://localhost:3005/api/projects/${projectId}/media`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(media),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to update media');
      }

      setSuccess(true);
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateMedia, loading, error, success };
}

// Usage in component
function ProjectMediaForm({ projectId, token }: { projectId: string; token: string }) {
  const { updateMedia, loading, error, success } = useProjectMedia(projectId, token);
  const [formData, setFormData] = useState<ProjectMedia>({
    imageUrl: '',
    videoUrl: '',
    githubUrl: '',
    documentationUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMedia(formData);
      // Handle success (e.g., show toast, refresh project data)
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Media'}
      </button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Media updated successfully!</div>}
    </form>
  );
}
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Update project media
async function updateProjectMedia(projectId: string, media: ProjectMedia) {
  try {
    const response = await api.put(`/projects/${projectId}/media`, media);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}
```

---

## Validation Rules

### Image URL
- **Format:** Must be a valid HTTP/HTTPS URL
- **Extension:** Must end with `.jpg`, `.jpeg`, `.png`, `.gif`, or `.webp` (case-insensitive)
- **Max Length:** 500 characters
- **Example Valid URLs:**
  - `https://example.com/image.jpg`
  - `https://cdn.example.com/project-image.PNG`
  - `http://example.com/pic.webp`

### Video URL
- **Format:** Must be from supported platforms
- **Supported Platforms:**
  - YouTube: `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`
  - Vimeo: `https://vimeo.com/...` or `https://www.vimeo.com/...`
  - Dailymotion: `https://dailymotion.com/...` or `https://www.dailymotion.com/...`
- **Max Length:** 500 characters
- **Example Valid URLs:**
  - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - `https://youtu.be/dQw4w9WgXcQ`
  - `https://vimeo.com/123456789`
  - `https://www.dailymotion.com/video/x123456`

### GitHub URL
- **Format:** Must be a valid GitHub repository URL
- **Pattern:** `https?://(www\.)?github\.com/.+`
- **Max Length:** 500 characters
- **Example Valid URLs:**
  - `https://github.com/username/repository`
  - `https://www.github.com/user/repo`
  - `http://github.com/org/project-name`

### Documentation URL
- **Format:** Must be a valid HTTP/HTTPS URL
- **Max Length:** 500 characters
- **Example Valid URLs:**
  - `https://docs.example.com/project`
  - `https://example.com/documentation`
  - `http://wiki.example.com/project-docs`

---

## Access Control

### Who Can Update Project Media?

1. **Project Leader:** Team members who are the team leader of the project
2. **Project Mentor:** Users assigned as the mentor of the project
3. **Admin:** Users with admin role or `system:admin` permission

### Access Check Logic

The system checks:
1. If user is admin → Allow
2. If user is team member AND project leader → Allow
3. If user is mentor/researcher AND project leader → Allow
4. If user is project mentor → Allow
5. Otherwise → Deny (403 Forbidden)

---

## Error Handling Best Practices

### Frontend Error Handling

```typescript
async function handleMediaUpdate(projectId: string, media: ProjectMedia) {
  try {
    const result = await updateProjectMedia(projectId, media, token);
    
    if (result.success) {
      // Show success message
      showToast('Media updated successfully', 'success');
      // Refresh project data
      refreshProjectData();
    } else {
      // Handle specific error types
      if (result.error?.includes('Access denied')) {
        showToast('You do not have permission to update this project', 'error');
      } else if (result.error?.includes('Validation failed')) {
        showToast('Please check the URL formats', 'error');
      } else if (result.error?.includes('not found')) {
        showToast('Project not found', 'error');
      } else {
        showToast(result.error || 'Failed to update media', 'error');
      }
    }
  } catch (error) {
    // Network or unexpected errors
    showToast('Network error. Please try again.', 'error');
  }
}
```

---

## Common Use Cases

### Use Case 1: Initial Media Setup
When a project is created, the team leader may want to add media URLs:

```typescript
await updateProjectMedia(projectId, {
  imageUrl: 'https://example.com/project-image.jpg',
  githubUrl: 'https://github.com/user/project',
});
```

### Use Case 2: Adding Video Demo
After completing a milestone, add a demo video:

```typescript
await updateProjectMedia(projectId, {
  videoUrl: 'https://www.youtube.com/watch?v=demo123',
});
```

### Use Case 3: Updating Project Image
Replace the project image with a new one:

```typescript
await updateProjectMedia(projectId, {
  imageUrl: 'https://example.com/new-project-image.png',
});
```

### Use Case 4: Removing a Media Field
Clear a media field by sending an empty string:

```typescript
await updateProjectMedia(projectId, {
  videoUrl: '', // This will clear the videoUrl field
});
```

---

## Testing

### Test with cURL

```bash
# Update all media fields
curl -X PUT "http://localhost:3005/api/projects/68f3d44daae2b97eb7be7571/media" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "githubUrl": "https://github.com/user/repo",
    "documentationUrl": "https://docs.example.com"
  }'

# Update only image
curl -X PUT "http://localhost:3005/api/projects/68f3d44daae2b97eb7be7571/media" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/new-image.jpg"}'
```

---

## Media Files Management

Team leaders can also manage media files through the `/api/media` endpoints. These endpoints allow you to upload, update, and delete media files that can be associated with projects.

### Create Media File

**Endpoint:** `POST /api/media`

**Access:** Project Leader, Media Owner, Mentor, or Admin

**Request Body:**
```json
{
  "title": "Project Demo Video",
  "description": "Demo video showcasing project features",
  "fileUrl": "https://example.com/videos/demo.mp4",
  "thumbnailUrl": "https://example.com/thumbnails/demo.jpg",
  "fileType": "video",
  "fileSize": 52428800,
  "dimensions": "1920x1080",
  "duration": 120,
  "categoryId": "64a1b2c3d4e5f6789012346",
  "tags": ["project", "demo", "video"],
  "isFeatured": false
}
```

**Note:** The `uploadedBy` field is automatically set to the authenticated user's ID.

### Update Media File

**Endpoint:** `PUT /api/media/:id`

**Access:** Project Leader, Media Owner, Mentor, or Admin

**Request Body:** Any updatable fields from the Media model

```json
{
  "title": "Updated Project Demo Video",
  "description": "Updated description",
  "isFeatured": true
}
```

### Delete Media File

**Endpoint:** `DELETE /api/media/:id`

**Access:** Project Leader, Media Owner, Mentor, or Admin

**Response:**
```json
{
  "success": true,
  "message": "Media deleted"
}
```

### Get Media File Details

**Endpoint:** `GET /api/media/:id`

**Access:** Public (optional authentication)

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "64a1b2c3d4e5f6789012348",
      "title": "Project Demo Video",
      "fileUrl": "https://example.com/videos/demo.mp4",
      "fileType": "video",
      "uploadedBy": {
        "_id": "68f3ce7c10e6eb3ccbb85979",
        "firstName": "John",
        "lastName": "Doe"
      },
      "viewCount": 42,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

### List Media Files

**Endpoint:** `GET /api/media`

**Access:** Public (optional authentication)

**Query Parameters:**
- `fileType` - Filter by type: `image`, `video`, `document`, `audio`
- `categoryId` - Filter by category
- `q` - Search by title
- `limit` - Number of items per page (default: 20, max: 100)
- `skip` - Number of items to skip (default: 0)

**Example:**
```bash
GET /api/media?fileType=video&limit=10&skip=0
```

---

## Related Endpoints

- **GET `/api/projects/:id`** - Get project details (includes current media URLs)
- **PUT `/api/projects/:id`** - Update project (can also update media along with other fields)
- **GET `/api/media`** - List all media files
- **GET `/api/media/:id`** - Get media file details
- **POST `/api/media`** - Create new media file
- **PUT `/api/media/:id`** - Update media file
- **DELETE `/api/media/:id`** - Delete media file

---

## Notes

1. **Partial Updates:** You can update any combination of media fields. Only the fields you provide will be updated.

2. **Clearing Fields:** To remove a media URL, send an empty string (`""`). The field will be set to `null`.

3. **Validation:** All URLs are validated on the server side. Invalid URLs will return a 400 error with validation details.

4. **Access Control:** Only project leaders, mentors, or admins can update media. The system automatically checks permissions.

5. **Response:** The response includes both the full project object and a `media` object with just the media fields for convenience.

---

## Support

For issues or questions:
- Check the error response for specific validation messages
- Verify the user has the correct role/permissions
- Ensure URLs match the required format patterns
- Check that the project ID is valid and exists

---

## Access Control Summary

### Project Media URLs (`/api/projects/:id/media`)
- ✅ Project Leader (team member who is leader of the project)
- ✅ Project Mentor
- ✅ Admin

### Media Files (`/api/media`)
- ✅ Project Leader (any project)
- ✅ Media Owner (user who uploaded the media)
- ✅ Mentor/Researcher
- ✅ Admin

**Note:** Project leaders are identified as users who are team leaders of at least one project. This allows them to manage media files even if they didn't upload them, giving them flexibility to manage project-related media.

---

**Last Updated:** January 2025

