# Project Self-Deletion API Documentation

## Overview
The Project Self-Deletion API allows users to delete their own projects where they are the team leader. This API provides a secure way for project leaders to remove their projects while maintaining proper authorization and safety checks.

## Endpoint

### DELETE /api/projects/:id/self

Deletes a project where the authenticated user is the team leader.

**URL:** `DELETE /api/projects/:id/self`

**Authentication:** Required (Bearer Token)

**Authorization:** User must be the team leader of the project

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the project to delete

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
  "message": "Project deleted successfully",
  "data": {
    "deletedProject": {
      "id": "507f1f77bcf86cd799439011",
      "title": "My Robotics Project",
      "deletedAt": "2025-01-18T10:30:00.000Z"
    }
  }
}
```

### Error Response (403 Forbidden)
```json
{
  "success": false,
  "error": {
    "message": "Access denied. You can only delete projects where you are the team leader.",
    "details": {
      "statusCode": 403,
      "isOperational": true,
      "message": "Access denied. You can only delete projects where you are the team leader."
    }
  },
  "timestamp": "2025-01-18T10:30:00.000Z",
  "path": "/api/projects/507f1f77bcf86cd799439011/self",
  "method": "DELETE"
}
```

### Error Response (400 Bad Request - Active Members)
```json
{
  "success": false,
  "error": {
    "message": "Cannot delete project with active team members. Please remove all team members first or transfer leadership.",
    "details": {
      "statusCode": 400,
      "isOperational": true,
      "message": "Cannot delete project with active team members. Please remove all team members first or transfer leadership.",
      "activeMembersCount": 3
    }
  },
  "timestamp": "2025-01-18T10:30:00.000Z",
  "path": "/api/projects/507f1f77bcf86cd799439011/self",
  "method": "DELETE"
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "error": {
    "message": "Project not found",
    "details": {
      "statusCode": 404,
      "isOperational": true,
      "message": "Project not found"
    }
  },
  "timestamp": "2025-01-18T10:30:00.000Z",
  "path": "/api/projects/507f1f77bcf86cd799439011/self",
  "method": "DELETE"
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
  "path": "/api/projects/507f1f77bcf86cd799439011/self",
  "method": "DELETE"
}
```

## Authorization Rules

### Who Can Delete Projects
- **Team Leader**: Users who are the `teamLeaderId` of the project
- **Admin**: System administrators (can delete any project via the admin endpoint)

### Who Cannot Delete Projects
- **Team Members**: Regular team members cannot delete projects
- **Mentors**: Mentors cannot delete projects unless they are the team leader
- **Other Users**: Users not associated with the project

## Safety Checks

### 1. Team Leader Verification
The API verifies that the authenticated user is the team leader of the project by comparing:
```javascript
project.teamLeaderId?.toString() === req.user.id
```

### 2. Active Members Check
The API prevents deletion of projects with active team members:
```javascript
const activeMembers = project.teamMembers.filter(member => member.isActive);
if (activeMembers.length > 0) {
  // Return error with activeMembersCount
}
```

### 3. Audit Logging
All project deletions are logged for audit purposes:
```javascript
logger.info(`Project deleted by team leader`, {
  projectId: id,
  projectTitle: project.title,
  teamLeaderId: req.user.id,
  teamLeaderEmail: req.user.email,
  deletedAt: new Date().toISOString()
});
```

## Example Usage

### Delete Your Own Project
```bash
curl -X DELETE "http://localhost:3005/api/projects/507f1f77bcf86cd799439011/self" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript/Fetch Example
```javascript
const deleteProject = async (projectId, token) => {
  try {
    const response = await fetch(`http://localhost:3005/api/projects/${projectId}/self`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Project deleted successfully:', data.data.deletedProject);
      return data.data.deletedProject;
    } else {
      console.error('Failed to delete project:', data.error.message);
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Usage
deleteProject('507f1f77bcf86cd799439011', 'your-jwt-token')
  .then(deletedProject => {
    console.log('Deleted:', deletedProject.title);
  })
  .catch(error => {
    console.error('Deletion failed:', error.message);
  });
```

### React Example
```jsx
import React, { useState } from 'react';

const ProjectDeletion = ({ projectId, token, onProjectDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/self`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        onProjectDeleted(data.data.deletedProject);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleDeleteProject}
        disabled={isDeleting}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Delete Project'}
      </button>
      {error && (
        <div className="text-red-600 mt-2">
          {error}
        </div>
      )}
    </div>
  );
};
```

## Error Handling

### Common Error Scenarios

1. **Unauthorized Access (403)**
   - User is not the team leader of the project
   - Solution: Verify project ownership or use admin endpoint

2. **Active Members Present (400)**
   - Project has active team members
   - Solution: Remove all team members first or transfer leadership

3. **Project Not Found (404)**
   - Invalid project ID or project doesn't exist
   - Solution: Verify project ID is correct

4. **Authentication Required (401)**
   - Missing or invalid JWT token
   - Solution: Provide valid authentication token

## Comparison with Admin Deletion

| Feature | Self-Deletion (`/self`) | Admin Deletion (`/`) |
|---------|------------------------|---------------------|
| **Authorization** | Team leader only | Mentor+ roles |
| **Safety Checks** | Active members check | None |
| **Audit Logging** | Detailed logging | Basic logging |
| **Use Case** | User self-service | Administrative action |
| **Restrictions** | Cannot delete with active members | Can delete any project |

## Best Practices

### Before Deletion
1. **Remove Team Members**: Remove all team members from the project
2. **Transfer Leadership**: If needed, transfer leadership to another user
3. **Backup Data**: Ensure important project data is backed up
4. **Notify Team**: Inform team members about the deletion

### After Deletion
1. **Verify Deletion**: Confirm the project is completely removed
2. **Update References**: Update any references to the deleted project
3. **Clean Up**: Remove any associated files or resources

## Rate Limiting

The API is subject to the same rate limiting as other authenticated endpoints. Check the server configuration for specific limits.

## Security Considerations

1. **Authentication**: Always use HTTPS in production
2. **Token Security**: Keep JWT tokens secure and don't expose them
3. **Audit Trail**: All deletions are logged for security auditing
4. **Authorization**: Multiple layers of authorization checks
5. **Input Validation**: Project ID is validated for proper ObjectId format

## Troubleshooting

### Common Issues

1. **"Access denied" Error**
   - Verify you are the team leader of the project
   - Check if the project ID is correct

2. **"Cannot delete with active members" Error**
   - Remove all team members from the project first
   - Or transfer leadership to another user

3. **"Project not found" Error**
   - Verify the project ID is correct
   - Check if the project still exists

4. **Authentication Errors**
   - Ensure your JWT token is valid and not expired
   - Check that the Authorization header is properly formatted
