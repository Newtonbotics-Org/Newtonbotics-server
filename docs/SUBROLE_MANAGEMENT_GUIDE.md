# Subrole Management System Documentation

## Overview

The Subrole Management System allows administrators to dynamically manage user subroles (additional responsibilities) without requiring code changes. This system provides full CRUD (Create, Read, Update, Delete) operations for subroles and integrates seamlessly with the existing user management system.

## What Are Subroles?

Subroles are additional responsibilities or specializations that users can have beyond their primary role. Examples include:
- **Club President** - Overall club leadership
- **Project Manager** - Manages specific projects
- **Team Lead** - Leads a team of members
- **Software Developer** - Technical specialization
- **Event Organizer** - Coordinates events
- **Lab Coordinator** - Manages lab operations

## Key Features

- ✅ **Dynamic Management** - Add/edit/remove subroles without code changes
- ✅ **Category Organization** - Subroles organized by functional categories
- ✅ **Permission Integration** - Subroles can have associated system permissions
- ✅ **Soft Delete** - Subroles are deactivated, not deleted (preserves data integrity)
- ✅ **Audit Trail** - Tracks who created/modified subroles
- ✅ **User Impact Protection** - Cannot delete subroles currently assigned to users
- ✅ **Validation** - Prevents assignment of inactive subroles

## API Endpoints

### Admin-Only Endpoints (Require Admin Authentication)

#### Get All Subroles
```http
GET /api/subroles
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `category` - Filter by category
- `isActive` - Filter by active status (true/false)
- `limit` - Number of results (1-100, default: 50)
- `skip` - Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "subroles": [
      {
        "_id": "subrole_id",
        "name": "project_manager",
        "displayName": "Project Manager",
        "description": "Manages and oversees project execution",
        "category": "management_leadership",
        "categoryDisplayName": "Management & Leadership",
        "permissions": ["manage:projects"],
        "priority": 10,
        "isActive": true,
        "createdBy": {
          "_id": "user_id",
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com"
        },
        "lastModifiedBy": {...},
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 69,
      "limit": 50,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

#### Get Specific Subrole
```http
GET /api/subroles/:id
Authorization: Bearer <admin-token>
```

#### Create New Subrole
```http
POST /api/subroles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "club_president",
  "displayName": "Club President",
  "description": "Overall club leadership and management",
  "category": "management_leadership",
  "permissions": ["manage:projects", "manage:system"],
  "priority": 10
}
```

**Required Fields:**
- `name` - Unique identifier (lowercase, underscores only, 2-100 chars)
- `displayName` - Human-readable name (2-100 chars)
- `category` - One of the predefined categories

**Optional Fields:**
- `description` - Detailed description (max 500 chars)
- `permissions` - Array of system permissions
- `priority` - Display ordering (default: 0)

#### Update Subrole
```http
PUT /api/subroles/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "displayName": "Updated Display Name",
  "description": "Updated description",
  "priority": 5,
  "isActive": true
}
```

#### Soft Delete Subrole
```http
DELETE /api/subroles/:id
Authorization: Bearer <admin-token>
```

**Note:** This sets `isActive` to false. Cannot delete if users are currently assigned this subrole.

#### Reactivate Subrole
```http
POST /api/subroles/:id/reactivate
Authorization: Bearer <admin-token>
```

#### Get Users with Specific Subrole
```http
GET /api/subroles/:id/users
Authorization: Bearer <admin-token>
```

#### Seed Default Subroles
```http
POST /api/subroles/seed
Authorization: Bearer <admin-token>
```

### Public Endpoints (Authenticated Users)

#### Get Active Subroles
```http
GET /api/subroles/active
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subroles": [
      {
        "name": "project_manager",
        "displayName": "Project Manager",
        "description": "Manages and oversees project execution",
        "category": "management_leadership",
        "categoryDisplayName": "Management & Leadership",
        "permissions": ["manage:projects"],
        "priority": 10
      }
    ]
  }
}
```

#### Get Subrole Categories
```http
GET /api/subroles/categories
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "value": "management_leadership",
        "displayName": "Management & Leadership"
      },
      {
        "value": "technical_specializations",
        "displayName": "Technical Specializations"
      }
    ]
  }
}
```

## Subrole Categories

The system includes 10 predefined categories:

1. **Management & Leadership** - Leadership and management roles
2. **Financial & Administrative** - Financial and administrative responsibilities
3. **Technical Specializations** - Technical and engineering roles
4. **Lab Operations** - Laboratory and equipment management
5. **Communication & Outreach** - Communication and marketing roles
6. **Event & Workshop Management** - Event and workshop coordination
7. **Research & Publication** - Research and academic roles
8. **Industry & Partnerships** - Industry relations and partnerships
9. **Student Support** - Student mentoring and support
10. **Special Designations** - Special positions and emergency contacts

## User Subrole Management

### Assign Subroles to Users
```http
PUT /api/users/:userId/subroles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "subroles": ["project_manager", "team_lead", "software_developer"]
}
```

### Get User Profile (includes subroles)
```http
GET /api/users/:userId
Authorization: Bearer <user-token>
```

**Response includes:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "role": "team_member",
      "subroles": ["project_manager", "team_lead"],
      "department": "Computer Science",
      // ... other user fields
    }
  }
}
```

## Available System Permissions

Subroles can be associated with the following system permissions:

### Project Permissions
- `read:projects` - View projects
- `write:projects` - Create/edit projects
- `delete:projects` - Delete projects
- `manage:projects` - Full project management

### Workshop Permissions
- `read:workshops` - View workshops
- `write:workshops` - Create/edit workshops
- `delete:workshops` - Delete workshops

### Event Permissions
- `read:events` - View events
- `write:events` - Create/edit events
- `delete:events` - Delete events

### Inventory Permissions
- `read:inventory` - View inventory
- `write:inventory` - Create/edit inventory
- `delete:inventory` - Delete inventory
- `manage:inventory` - Full inventory management

### Request Permissions
- `read:requests` - View requests
- `write:requests` - Create/edit requests
- `approve:requests` - Approve requests

### News Permissions
- `read:news` - View news
- `write:news` - Create/edit news
- `delete:news` - Delete news

### Media Permissions
- `read:media` - View media
- `write:media` - Create/edit media
- `delete:media` - Delete media

### User Permissions
- `read:users` - View users
- `write:users` - Create/edit users
- `delete:users` - Delete users

### Subrole Permissions
- `read:subroles` - View subroles
- `write:subroles` - Create/edit subroles
- `delete:subroles` - Delete subroles
- `manage:subroles` - Full subrole management

### System Permissions
- `manage:finance` - Financial management
- `manage:system` - System management
- `system:admin` - Full system administration

## Database Setup

### Initial Setup

1. **Seed Default Subroles:**
   ```bash
   node scripts/seedSubroles.js
   ```

2. **Verify Setup:**
   ```bash
   node scripts/testSubroleAPI.js
   ```

### Database Schema

#### Subrole Collection
```javascript
{
  _id: ObjectId,
  name: String,           // Unique identifier
  displayName: String,     // Human-readable name
  description: String,     // Optional description
  category: String,        // Category enum
  permissions: [String],   // Associated permissions
  priority: Number,        // Display ordering
  isActive: Boolean,       // Active status
  createdBy: ObjectId,     // Creator reference
  lastModifiedBy: ObjectId, // Last modifier reference
  createdAt: Date,
  updatedAt: Date
}
```

#### User Collection (Updated)
```javascript
{
  // ... existing user fields
  subroles: [String],      // Array of subrole names
  // ... other fields
}
```

## Admin Usage Guide

### 1. Getting Started

1. **Login as Admin:**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@newtonbotics.com",
     "password": "your_password"
   }
   ```

2. **Get Available Subroles:**
   ```bash
   GET /api/subroles/active
   ```

### 2. Creating New Subroles

**Example: Create a Club President subrole**
```bash
POST /api/subroles
{
  "name": "club_president",
  "displayName": "Club President",
  "description": "Overall club leadership and strategic direction",
  "category": "management_leadership",
  "permissions": ["manage:projects", "manage:system", "manage:finance"],
  "priority": 100
}
```

**Example: Create a Technical Lead subrole**
```bash
POST /api/subroles
{
  "name": "technical_lead",
  "displayName": "Technical Lead",
  "description": "Provides technical leadership and guidance",
  "category": "technical_specializations",
  "permissions": ["read:projects", "write:projects", "manage:projects"],
  "priority": 50
}
```

### 3. Managing Existing Subroles

**Update a subrole:**
```bash
PUT /api/subroles/:subroleId
{
  "description": "Updated description",
  "priority": 75,
  "permissions": ["manage:projects", "manage:system"]
}
```

**Deactivate a subrole:**
```bash
DELETE /api/subroles/:subroleId
```

**Reactivate a subrole:**
```bash
POST /api/subroles/:subroleId/reactivate
```

### 4. Assigning Subroles to Users

**Assign multiple subroles to a user:**
```bash
PUT /api/users/:userId/subroles
{
  "subroles": ["club_president", "project_manager", "technical_lead"]
}
```

**Remove all subroles from a user:**
```bash
PUT /api/users/:userId/subroles
{
  "subroles": []
}
```

### 5. Monitoring and Reporting

**Get all users with a specific subrole:**
```bash
GET /api/subroles/:subroleId/users
```

**Get subrole statistics:**
```bash
GET /api/subroles?limit=100
```

## Best Practices

### 1. Naming Conventions
- Use lowercase with underscores for `name` field
- Use descriptive, professional names for `displayName`
- Keep descriptions concise but informative

### 2. Permission Assignment
- Only assign necessary permissions
- Follow principle of least privilege
- Review permissions regularly

### 3. Category Organization
- Use appropriate categories for better organization
- Consider creating new categories if needed
- Maintain consistent naming within categories

### 4. Priority Management
- Use higher numbers for more important subroles
- Consider using ranges (0-10, 10-20, etc.) for different categories
- Review and adjust priorities as needed

### 5. User Assignment
- Assign subroles based on actual responsibilities
- Regularly review user subrole assignments
- Remove subroles when responsibilities change

## Troubleshooting

### Common Issues

1. **Cannot delete subrole:**
   - Check if any users are assigned this subrole
   - Use the `/api/subroles/:id/users` endpoint to see assigned users
   - Reassign users to other subroles first

2. **Subrole not appearing in active list:**
   - Check if `isActive` is set to `true`
   - Verify the subrole exists in the database

3. **User subrole assignment fails:**
   - Ensure the subrole exists and is active
   - Check for typos in subrole names
   - Verify user has proper permissions

4. **Permission errors:**
   - Ensure you're logged in as an admin
   - Check if your token is valid and not expired
   - Verify you have the required permissions

### Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (subrole/user not found)
- `409` - Conflict (duplicate subrole name)
- `500` - Internal Server Error

## Security Considerations

1. **Admin-Only Operations:** All CRUD operations require admin authentication
2. **Input Validation:** All inputs are validated for format and content
3. **Soft Deletes:** Subroles are deactivated, not deleted, preserving data integrity
4. **Audit Trail:** All changes are logged with user information
5. **Permission Integration:** Subroles integrate with existing permission system

## Future Enhancements

Potential future improvements:
- Bulk subrole operations
- Subrole templates
- Advanced reporting and analytics
- Integration with external systems
- Automated subrole assignment based on criteria
- Subrole hierarchy and dependencies

## Support

For technical support or questions about the subrole management system:
- Check the API documentation
- Review the error messages and status codes
- Contact the development team for advanced issues

---

*This documentation covers the complete subrole management system implementation. The system provides administrators with full control over user subroles while maintaining data integrity and security.*
