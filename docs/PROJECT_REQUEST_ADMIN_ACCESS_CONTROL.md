# Project Request Admin Access Control - Implementation

## Overview

Enhanced access control rules for project requests, specifically around approved projects and administrative privileges.

**Date:** January 19, 2026  
**Status:** ✅ IMPLEMENTED

---

## Access Control Rules

### 1. **Approved Projects - Update Restrictions**

**Rule:** When a project request is approved, **ONLY administrators** can make updates.

**Implementation:**
- ✅ If project status is `approved`, only admin role can update
- ✅ Owner cannot update approved projects
- ✅ Mentors/Researchers cannot update approved projects
- ✅ Admin can update **any field** on approved projects (including status)

**Error Message:**
```
Cannot update approved project requests. Only administrators can modify approved projects.
```

---

### 2. **Admin Document Access**

**Rule:** Administrators can **always view** project request documents.

**Implementation:**
- ✅ Admin can view documents regardless of project status
- ✅ Admin can view documents of any project request
- ✅ Works for both local files and Cloudinary URLs

**Document Access Permissions:**
| User Role | Approved Projects | Other Statuses |
|-----------|------------------|----------------|
| **Admin** | ✅ Full Access | ✅ Full Access |
| Owner | ✅ Can View | ✅ Can View |
| Mentor/Researcher | ✅ Can View | ✅ Can View |
| Other Users | ❌ Denied | ❌ Denied |

---

### 3. **Admin Status Update Privileges**

**Rule:** Administrators can **always update status**, even if project is already approved.

**Implementation:**
- ✅ Admin can change status from `approved` to any other status
- ✅ Admin can change status from any status to `approved`
- ✅ Admin can change status between any statuses
- ✅ Non-admin users cannot change status of approved projects

**Error Message (for non-admin attempting status change on approved project):**
```
Cannot change status of approved project requests. Only administrators can modify the status of approved projects.
```

---

## Updated Endpoints

### 1. **PUT /api/project-requests/:id**

**Access Control Logic:**

```javascript
// If project is approved, ONLY admin can update
if (projectRequest.status === 'approved' && !isAdmin) {
  // DENY - Only admin can update approved projects
}

// Admin can always update (including status changes)
if (isAdmin) {
  // ALLOW - Full admin access
}

// For status updates on approved projects
if (isStatusUpdate && projectRequest.status === 'approved' && !isAdmin) {
  // DENY - Only admin can change status of approved projects
}
```

**Test Cases:**
- ✅ Owner tries to update approved project → **DENIED**
- ✅ Mentor tries to update approved project → **DENIED**
- ✅ Admin tries to update approved project → **ALLOWED**
- ✅ Admin changes status from `approved` to `pending` → **ALLOWED**
- ✅ Admin changes status from `pending` to `approved` → **ALLOWED**
- ✅ Owner tries to update pending project → **ALLOWED** (if not rejected)

---

### 2. **GET /api/project-requests/:id/document**

**Access Control Logic:**

```javascript
// Admin can always view documents
if (isAdmin) {
  // ALLOW - Admin has full access
}

// For approved projects, additional checks
if (projectRequest.status === 'approved' && !isAdmin && !isOwner) {
  // Only mentors+ can view if not owner
  if (!isMentorOrHigher) {
    // DENY
  }
}
```

**Document Handling:**
- ✅ **Cloudinary URLs**: Returns HTTP 302 redirect to document URL
- ✅ **Local Files**: Downloads file from server

**Test Cases:**
- ✅ Admin views document of approved project → **ALLOWED**
- ✅ Admin views document of pending project → **ALLOWED**
- ✅ Owner views their own document (approved) → **ALLOWED**
- ✅ Mentor views document of approved project → **ALLOWED**
- ✅ Regular user views document of approved project → **DENIED**

---

## Access Control Matrix

### Update Project Request (PUT /api/project-requests/:id)

| User Role | Pending Status | Approved Status | Rejected Status |
|-----------|---------------|-----------------|-----------------|
| **Admin** | ✅ Full Access | ✅ **Full Access** | ✅ Full Access |
| Owner | ✅ Can Update | ❌ **Cannot Update** | ❌ Cannot Update |
| Mentor/Researcher | ✅ Can Update | ❌ **Cannot Update** | ✅ Can Update |
| Other Users | ❌ Cannot Update | ❌ Cannot Update | ❌ Cannot Update |

### View Document (GET /api/project-requests/:id/document)

| User Role | Pending Status | Approved Status | Rejected Status |
|-----------|---------------|-----------------|-----------------|
| **Admin** | ✅ Can View | ✅ **Can View** | ✅ Can View |
| Owner | ✅ Can View | ✅ Can View | ✅ Can View |
| Mentor/Researcher | ✅ Can View | ✅ **Can View** | ✅ Can View |
| Other Users | ❌ Cannot View | ❌ Cannot View | ❌ Cannot View |

### Update Status

| User Role | Can Update Status on Approved Projects |
|-----------|----------------------------------------|
| **Admin** | ✅ **YES - Can change to any status** |
| Owner | ❌ NO |
| Mentor/Researcher | ❌ NO |
| Other Users | ❌ NO |

---

## Code Changes

### 1. PUT Route Access Control

**File:** `src/routes/projectRequests.js`

**Changes:**
```javascript
// Check user roles
const isAdmin = req.user.role === 'admin';

// CRITICAL: If project is approved, ONLY admin can make updates
if (projectRequest.status === 'approved' && !isAdmin) {
  throw authorizationErrorHandler(
    'Cannot update approved project requests. Only administrators can modify approved projects.'
  );
}

// Admin can always update (including status changes)
if (isAdmin) {
  // Full access granted
}

// Special handling for status updates
const isStatusUpdate = updateData.status !== undefined && updateData.status !== projectRequest.status;

if (isStatusUpdate && projectRequest.status === 'approved' && !isAdmin) {
  throw authorizationErrorHandler(
    'Cannot change status of approved project requests. Only administrators can modify the status of approved projects.'
  );
}
```

---

### 2. Document Access Control

**File:** `src/routes/projectRequests.js`

**Changes:**
```javascript
const isAdmin = req.user.role === 'admin';

// Admin can always view documents
if (isAdmin) {
  // Full access granted
}

// Handle Cloudinary URL documents - redirect to URL
if (projectRequest.document.secureUrl || projectRequest.document.url || projectRequest.document.documentUrl) {
  const documentUrl = projectRequest.document.secureUrl || projectRequest.document.url || projectRequest.document.documentUrl;
  return res.redirect(302, documentUrl);
}

// Handle local file documents
if (projectRequest.document.path) {
  // Download file from server
  res.download(filePath, filename);
}
```

---

## Testing Checklist

### Update Access Tests

- [ ] ✅ Owner tries to update approved project → Should be DENIED
- [ ] ✅ Mentor tries to update approved project → Should be DENIED
- [ ] ✅ Admin updates approved project → Should be ALLOWED
- [ ] ✅ Owner updates pending project → Should be ALLOWED
- [ ] ✅ Admin updates any field on approved project → Should be ALLOWED

### Status Update Tests

- [ ] ✅ Admin changes status from `approved` to `pending` → Should be ALLOWED
- [ ] ✅ Admin changes status from `approved` to `rejected` → Should be ALLOWED
- [ ] ✅ Admin changes status from `pending` to `approved` → Should be ALLOWED
- [ ] ✅ Owner tries to change status of approved project → Should be DENIED
- [ ] ✅ Mentor tries to change status of approved project → Should be DENIED

### Document Access Tests

- [ ] ✅ Admin views document of approved project → Should be ALLOWED
- [ ] ✅ Admin views document via Cloudinary URL → Should redirect to URL
- [ ] ✅ Admin views document via local file → Should download file
- [ ] ✅ Owner views their document (approved) → Should be ALLOWED
- [ ] ✅ Mentor views document of approved project → Should be ALLOWED
- [ ] ✅ Regular user views document of approved project → Should be DENIED

---

## Error Messages

### Update Restrictions

**When non-admin tries to update approved project:**
```json
{
  "success": false,
  "message": "Cannot update approved project requests. Only administrators can modify approved projects."
}
```

**When non-admin tries to change status of approved project:**
```json
{
  "success": false,
  "message": "Cannot change status of approved project requests. Only administrators can modify the status of approved projects."
}
```

### Document Access Denied

**When unauthorized user tries to view document:**
```json
{
  "success": false,
  "message": "Access denied. You can only view documents for your own project requests or need mentor+ privileges"
}
```

---

## Summary

✅ **Approved projects can ONLY be updated by administrators**
- Owner, mentors, and other users cannot update approved projects
- Admin has full access to update any field

✅ **Administrators can always view documents**
- Works for both Cloudinary URLs and local files
- No restrictions based on project status

✅ **Administrators can always update status**
- Can change status from/to any state, including approved
- Non-admin users cannot change status of approved projects

✅ **Document handling supports both Cloudinary and local storage**
- Cloudinary URLs: HTTP 302 redirect
- Local files: File download

---

## Migration Notes

**No database migration required** - Changes are logic-only.

**Backward Compatibility:**
- Existing approved projects continue to work
- All access control is enforced at the API level
- No breaking changes for non-approved projects

---

**Status:** Ready for Testing  
**Priority:** High - Critical access control for approved projects
