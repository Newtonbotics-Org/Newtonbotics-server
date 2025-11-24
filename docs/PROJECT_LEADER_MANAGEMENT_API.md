# Project Leader Management API Documentation

## Overview

This document describes the enhanced project management functionality that allows **team members who are project leaders** to fully manage their projects without requiring admin access. Project leaders can now update all project fields, manage team members, and update project images.

## Key Changes

### New Middleware: `requireProjectLeaderAccess`

A new middleware has been added that grants full project management access to:
- **Team members** (`role: 'team_member'`) who are also **project leaders** (`teamLeaderId`)
- **Mentors/Researchers** who are project leaders
- **Admins** (always have access)
- **Mentors** of the project (read-only access)

### Access Control Summary

| User Type | Project Leader? | Can Manage Project? | Can Update Images? | Can Manage Members? |
|-----------|---------------|-------------------|-------------------|-------------------|
| Team Member | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Team Member | ❌ No | ❌ No | ❌ No | ❌ No |
| Mentor | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Mentor | ❌ No (but is mentor) | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| Admin | N/A | ✅ Yes | ✅ Yes | ✅ Yes |

## Updated API Endpoints

### 1. Update Project (PUT)

**Endpoint:** `PUT /api/projects/:id`

**Access:** Project leaders (team members who are leaders), mentors, or admins

**Description:** Allows project leaders to update all project fields including images.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated Project Title",
  "description": "Updated project description",
  "category": "Research",
  "status": "ongoing",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T00:00:00.000Z",
  "budget": 50000,
  "mentorId": "64a1b2c3d4e5f6789012345",
  "imageUrl": "https://example.com/images/project.jpg",
  "videoUrl": "https://youtube.com/watch?v=example",
  "githubUrl": "https://github.com/user/repo",
  "documentationUrl": "https://docs.example.com",
  "achievements": ["Achievement 1", "Achievement 2"],
  "tags": ["tag1", "tag2"]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Project updated",
  "data": {
    "project": {
      "_id": "64a1b2c3d4e5f6789012346",
      "title": "Updated Project Title",
      "description": "Updated project description",
      "imageUrl": "https://example.com/images/project.jpg",
      "teamLeaderId": {
        "_id": "64a1b2c3d4e5f6789012347",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "team_member"
      },
      // ... other project fields
    }
  }
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "error": {
    "message": "Access denied. You must be a team member and project leader, or a mentor/admin to manage this project",
    "statusCode": 403
  }
}
```

**Frontend Example:**
```javascript
// Update project including image
const updateProject = async (projectId, projectData) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...projectData,
      imageUrl: 'https://example.com/new-image.jpg'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update project');
  }
  
  return await response.json();
};
```

### 2. Add Team Member (POST)

**Endpoint:** `POST /api/projects/:id/members`

**Access:** Project leaders (team members who are leaders), mentors, or admins

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6789012348",
  "role": "Developer",
  "skills": ["JavaScript", "React"],
  "responsibilities": ["Frontend development", "UI/UX"]
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Member added",
  "data": {
    "members": [
      {
        "_id": "64a1b2c3d4e5f6789012349",
        "userId": {
          "_id": "64a1b2c3d4e5f6789012348",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@example.com"
        },
        "userName": "Jane Smith",
        "role": "Developer",
        "skills": ["JavaScript", "React"],
        "responsibilities": ["Frontend development", "UI/UX"],
        "joinedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### 3. Update Team Member (PUT/PATCH)

**Endpoint:** `PUT /api/projects/:id/members/:memberId` or `PATCH /api/projects/:id/members/:memberId`

**Access:** Project leaders (team members who are leaders), mentors, or admins

**Request Body:**
```json
{
  "role": "Senior Developer",
  "skills": ["JavaScript", "React", "Node.js"],
  "responsibilities": ["Frontend development", "Backend integration"],
  "isActive": true
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Member updated",
  "data": {
    "members": [/* updated members array */]
  }
}
```

### 4. Remove Team Member (DELETE)

**Endpoint:** `DELETE /api/projects/:id/members/:memberId`

**Access:** Project leaders (team members who are leaders), mentors, or admins

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Member removed",
  "data": {
    "members": [/* updated members array */]
  }
}
```

## Frontend Implementation Guide

### 1. Check if User is Project Leader

Before showing management options, check if the current user is the project leader:

```javascript
const isProjectLeader = (project, currentUser) => {
  // Check if user is team member role AND project leader
  return (
    currentUser.role === 'team_member' &&
    project.teamLeaderId?._id === currentUser.id
  ) || currentUser.role === 'admin';
};

// Usage
const canManageProject = isProjectLeader(project, currentUser);
```

### 2. Update Project Image

```javascript
const updateProjectImage = async (projectId, imageUrl) => {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update image');
    }

    const result = await response.json();
    return result.data.project;
  } catch (error) {
    console.error('Error updating project image:', error);
    throw error;
  }
};
```

### 3. Full Project Update Example

```javascript
const updateProject = async (projectId, updates) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: updates.title,
      description: updates.description,
      status: updates.status,
      imageUrl: updates.imageUrl, // Project leaders can update this
      videoUrl: updates.videoUrl,
      githubUrl: updates.githubUrl,
      documentationUrl: updates.documentationUrl,
      category: updates.category,
      budget: updates.budget,
      startDate: updates.startDate,
      endDate: updates.endDate,
      achievements: updates.achievements,
      tags: updates.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update project');
  }

  return await response.json();
};
```

### 4. Error Handling

```javascript
const handleProjectUpdate = async (projectId, data) => {
  try {
    const result = await updateProject(projectId, data);
    // Show success message
    showNotification('Project updated successfully', 'success');
    return result;
  } catch (error) {
    if (error.message.includes('Access denied')) {
      // User doesn't have permission
      showNotification('You do not have permission to manage this project', 'error');
    } else {
      // Other errors
      showNotification('Failed to update project', 'error');
    }
    throw error;
  }
};
```

## UI/UX Recommendations

### 1. Show Management Options Conditionally

```jsx
{isProjectLeader(project, currentUser) && (
  <div className="project-management-actions">
    <button onClick={handleEditProject}>Edit Project</button>
    <button onClick={handleManageMembers}>Manage Members</button>
    <button onClick={handleUpdateImage}>Update Image</button>
  </div>
)}
```

### 2. Image Upload Component

```jsx
const ProjectImageUpload = ({ projectId, currentImageUrl, onImageUpdated }) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      // First upload image to your storage service
      const imageUrl = await uploadToStorage(file);
      
      // Then update project with new image URL
      await updateProjectImage(projectId, imageUrl);
      onImageUpdated(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <img src={currentImageUrl} alt="Project" />
      {isProjectLeader && (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e.target.files[0])}
          disabled={uploading}
        />
      )}
    </div>
  );
};
```

### 3. Permission-Based UI

```jsx
const ProjectManagementPanel = ({ project, currentUser }) => {
  const canManage = isProjectLeader(project, currentUser) || 
                   currentUser.role === 'admin' ||
                   (currentUser.role === 'mentor' && project.mentorId === currentUser.id);

  if (!canManage) {
    return <div>You don't have permission to manage this project</div>;
  }

  return (
    <div className="management-panel">
      <h3>Project Management</h3>
      <ProjectForm project={project} />
      <TeamMemberManagement projectId={project._id} />
      <ImageUpload projectId={project._id} />
    </div>
  );
};
```

## Validation Rules

### Image URL Validation

The `imageUrl` field must:
- Be a valid URL (http:// or https://)
- End with a valid image extension (.jpg, .jpeg, .png, .gif, .webp)
- Not exceed 500 characters

**Valid Examples:**
- `https://example.com/images/project.jpg`
- `http://cdn.example.com/project.png`
- `https://storage.example.com/projects/image.webp`

**Invalid Examples:**
- `example.com/image.jpg` (missing protocol)
- `https://example.com/image.txt` (invalid extension)
- `https://example.com/image` (missing extension)

## Testing Checklist

When implementing the frontend, test the following scenarios:

- [ ] Team member who is project leader can update project
- [ ] Team member who is project leader can update image
- [ ] Team member who is project leader can manage members
- [ ] Team member who is NOT project leader cannot manage project
- [ ] Admin can manage any project
- [ ] Mentor can manage projects they mentor
- [ ] Error messages display correctly for unauthorized access
- [ ] Image URL validation works correctly
- [ ] All project fields can be updated by project leader

## Migration Notes

### Breaking Changes

**None** - This is a new feature that extends existing functionality. Existing endpoints continue to work as before.

### Backward Compatibility

- Existing `requireProjectTeamMember` middleware still works for read access
- New `requireProjectLeaderAccess` middleware is used for management operations
- All existing API calls will continue to work

## Support

For questions or issues related to this feature, please refer to:
- Main API Documentation: `docs/PROJECT_REQUEST_API_DETAILED.md`
- Authentication: `docs/USERS_FRONTEND_API_UPDATED.md`

---

**Last Updated:** 2024-01-15
**Version:** 2.0

