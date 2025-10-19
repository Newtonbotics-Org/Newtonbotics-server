# Subrole Management - Quick Reference Guide

## 🚀 Quick Start

### 1. Login as Admin
```bash
POST /api/auth/login
{
  "email": "admin@newtonbotics.com",
  "password": "your_password"
}
```

### 2. Seed Default Subroles (First Time Only)
```bash
node scripts/seedSubroles.js
```

### 3. Get Available Subroles
```bash
GET /api/subroles/active
Authorization: Bearer <admin-token>
```

## 📋 Common Operations

### Create New Subrole
```bash
POST /api/subroles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "club_president",
  "displayName": "Club President",
  "description": "Overall club leadership",
  "category": "management_leadership",
  "permissions": ["manage:projects", "manage:system"],
  "priority": 100
}
```

### Update Subrole
```bash
PUT /api/subroles/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "description": "Updated description",
  "priority": 50
}
```

### Assign Subroles to User
```bash
PUT /api/users/:userId/subroles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "subroles": ["project_manager", "team_lead"]
}
```

### Deactivate Subrole
```bash
DELETE /api/subroles/:id
Authorization: Bearer <admin-token>
```

### Reactivate Subrole
```bash
POST /api/subroles/:id/reactivate
Authorization: Bearer <admin-token>
```

## 📊 Available Categories

| Category | Description | Example Subroles |
|----------|-------------|------------------|
| `management_leadership` | Leadership roles | Project Manager, Team Lead |
| `technical_specializations` | Technical roles | Software Developer, Hardware Engineer |
| `lab_operations` | Lab management | Lab Coordinator, Safety Officer |
| `communication_outreach` | Communication roles | Social Media Manager, PR Officer |
| `event_workshop_management` | Event coordination | Event Organizer, Workshop Coordinator |
| `research_publication` | Research roles | Research Lead, Publication Coordinator |
| `industry_partnerships` | Industry relations | Industry Liaison, Business Developer |
| `student_support` | Student assistance | Student Advisor, Peer Mentor |
| `financial_administrative` | Admin roles | Finance Manager, HR Coordinator |
| `special_designations` | Special positions | POC, Emergency Contact |

## 🔑 System Permissions

### Project Permissions
- `read:projects` - View projects
- `write:projects` - Create/edit projects
- `delete:projects` - Delete projects
- `manage:projects` - Full project management

### User Management
- `read:users` - View users
- `write:users` - Create/edit users
- `delete:users` - Delete users

### Subrole Management
- `read:subroles` - View subroles
- `write:subroles` - Create/edit subroles
- `delete:subroles` - Delete subroles
- `manage:subroles` - Full subrole management

### System Administration
- `manage:system` - System management
- `system:admin` - Full system administration

## 🎯 Example Subroles

### Management Roles
```json
{
  "name": "club_president",
  "displayName": "Club President",
  "description": "Overall club leadership and strategic direction",
  "category": "management_leadership",
  "permissions": ["manage:projects", "manage:system", "manage:finance"],
  "priority": 100
}
```

### Technical Roles
```json
{
  "name": "software_developer",
  "displayName": "Software Developer",
  "description": "Develops software applications and systems",
  "category": "technical_specializations",
  "permissions": ["read:projects", "write:projects"],
  "priority": 50
}
```

### Event Management
```json
{
  "name": "event_organizer",
  "displayName": "Event Organizer",
  "description": "Plans and coordinates club events",
  "category": "event_workshop_management",
  "permissions": ["read:events", "write:events"],
  "priority": 30
}
```

## 🔍 Useful Queries

### Get All Subroles
```bash
GET /api/subroles?limit=100
Authorization: Bearer <admin-token>
```

### Get Subroles by Category
```bash
GET /api/subroles?category=management_leadership
Authorization: Bearer <admin-token>
```

### Get Users with Specific Subrole
```bash
GET /api/subroles/:subroleId/users
Authorization: Bearer <admin-token>
```

### Get User Profile (includes subroles)
```bash
GET /api/users/:userId
Authorization: Bearer <admin-token>
```

## ⚠️ Important Notes

1. **Subrole Names:** Must be lowercase with underscores only (e.g., `club_president`)
2. **Soft Delete:** Subroles are deactivated, not deleted
3. **User Protection:** Cannot delete subroles assigned to users
4. **Validation:** All subrole assignments are validated against active subroles
5. **Permissions:** Only admins can manage subroles

## 🚨 Troubleshooting

### Cannot Delete Subrole
- Check if users are assigned: `GET /api/subroles/:id/users`
- Reassign users first, then delete

### Subrole Not Appearing
- Check if `isActive: true`
- Verify subrole exists in database

### Assignment Fails
- Ensure subrole exists and is active
- Check for typos in subrole names
- Verify admin permissions

## 📞 Support

For detailed documentation, see: `docs/SUBROLE_MANAGEMENT_GUIDE.md`

For testing, run: `node scripts/testSubroleAPI.js`
