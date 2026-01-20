# Admin Panel - Project Request Access Control Integration Guide

## For Frontend Developers

This document outlines the access control rules and UI/UX changes required for the Admin Panel when working with Project Requests.

**Last Updated:** January 19, 2026  
**Status:** Ready for Implementation

---

## Overview

Project Requests now have enhanced access control rules, specifically:
1. **Approved projects can ONLY be edited by administrators**
2. **Administrators have full access** to view documents and update any field
3. **Administrators can change status** even on approved projects

---

## Key Access Control Rules

### 1. Approved Project Updates

**Rule:** When a project request status is `approved`, **ONLY admins** can make updates.

**Frontend Impact:**
- Hide/disable edit buttons for non-admin users when `status === 'approved'`
- Show edit buttons only for admins when `status === 'approved'`
- Display appropriate error messages when non-admin users try to edit

### 2. Admin Document Access

**Rule:** Administrators can **always view** project request documents.

**Frontend Impact:**
- Always show "View Document" button for admins
- Enable document download/view for admins regardless of status

### 3. Admin Status Updates

**Rule:** Administrators can **always update status**, even on approved projects.

**Frontend Impact:**
- Show status dropdown/selector for admins on all projects
- Allow admins to change status from `approved` to any other status
- Allow admins to change status to `approved` from any status

---

## UI/UX Changes Required

### 1. Project Request List/Table

**Show/Hide Edit Button Logic:**

```javascript
const canEdit = (projectRequest, currentUser) => {
  // Admin can always edit
  if (currentUser.role === 'admin') {
    return true;
  }
  
  // If approved, only admin can edit
  if (projectRequest.status === 'approved') {
    return false; // Only admin can edit (checked above)
  }
  
  // Owner can edit if not approved/rejected
  if (projectRequest.submittedBy === currentUser.id) {
    return projectRequest.status !== 'rejected';
  }
  
  // Mentors can edit non-approved projects
  if (['mentor', 'researcher'].includes(currentUser.role)) {
    return projectRequest.status !== 'approved';
  }
  
  return false;
};

// In your component
{canEdit(projectRequest, currentUser) && (
  <Button onClick={() => handleEdit(projectRequest)}>
    Edit Project Request
  </Button>
)}
```

**Show/Hide Status Dropdown:**

```javascript
const canChangeStatus = (projectRequest, currentUser) => {
  // Admin can always change status
  if (currentUser.role === 'admin') {
    return true;
  }
  
  // Non-admin cannot change status of approved projects
  if (projectRequest.status === 'approved') {
    return false;
  }
  
  // Mentors can change status of non-approved projects
  if (['mentor', 'researcher'].includes(currentUser.role)) {
    return true;
  }
  
  return false;
};

// In your component
{canChangeStatus(projectRequest, currentUser) && (
  <Select 
    value={projectRequest.status}
    onChange={(e) => handleStatusChange(projectRequest.id, e.target.value)}
  >
    <option value="pending">Pending</option>
    <option value="under_review">Under Review</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
    <option value="on_hold">On Hold</option>
  </Select>
)}
```

---

### 2. Project Request Detail/Edit Page

**Disable Form Fields Logic:**

```javascript
const isEditable = (projectRequest, currentUser) => {
  // Admin can always edit
  if (currentUser.role === 'admin') {
    return true;
  }
  
  // If approved, only admin can edit (already checked above)
  if (projectRequest.status === 'approved') {
    return false;
  }
  
  // Owner can edit if not approved/rejected
  if (projectRequest.submittedBy === currentUser.id) {
    return projectRequest.status !== 'rejected';
  }
  
  return false;
};

// In your component
<Form disabled={!isEditable(projectRequest, currentUser)}>
  <Input 
    name="title" 
    value={formData.title}
    disabled={!isEditable(projectRequest, currentUser)}
  />
  <Input 
    name="description"
    value={formData.description}
    disabled={!isEditable(projectRequest, currentUser)}
  />
  {/* Other fields */}
</Form>
```

**Show Warning Message:**

```javascript
{projectRequest.status === 'approved' && currentUser.role !== 'admin' && (
  <Alert variant="warning">
    <strong>Read-Only Mode:</strong> This project request is approved and can only be edited by administrators.
  </Alert>
)}
```

---

### 3. Document View/Download Button

**Access Control:**

```javascript
const canViewDocument = (projectRequest, currentUser) => {
  const isOwner = projectRequest.submittedBy === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const isMentorOrHigher = ['mentor', 'researcher', 'admin'].includes(currentUser.role);
  
  // Admin can always view
  if (isAdmin) {
    return true;
  }
  
  // Owner can always view their own documents
  if (isOwner) {
    return true;
  }
  
  // Mentors can view documents
  if (isMentorOrHigher) {
    return true;
  }
  
  return false;
};

// In your component
{projectRequest.document && canViewDocument(projectRequest, currentUser) && (
  <Button onClick={() => handleViewDocument(projectRequest.id)}>
    <Icon name="download" />
    View Document: {projectRequest.document.originalName || projectRequest.document.documentName}
  </Button>
)}
```

---

### 4. Status Update Component (Admin Only)

**Admin Status Selector:**

```javascript
// Only show for admins
{currentUser.role === 'admin' && (
  <Card>
    <CardHeader>Status Management (Admin Only)</CardHeader>
    <CardBody>
      <FormGroup>
        <Label>Project Status</Label>
        <Select
          value={projectRequest.status}
          onChange={(e) => handleStatusUpdate(projectRequest.id, e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
        </Select>
      </FormGroup>
      <Button 
        onClick={() => handleSaveStatus(projectRequest.id)}
        color="primary"
      >
        Update Status
      </Button>
    </CardBody>
  </Card>
)}
```

---

## API Error Handling

### Handling Update Errors

**When non-admin tries to update approved project:**

```javascript
const handleUpdate = async (projectRequestId, updateData) => {
  try {
    const response = await axios.put(
      `/api/project-requests/${projectRequestId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // Success handling
    showSuccessMessage('Project request updated successfully');
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Access denied';
      
      // Check if it's an approved project error
      if (message.includes('approved project requests')) {
        showErrorMessage(
          'Cannot update approved project requests. Only administrators can modify approved projects.',
          {
            action: 'View Read-Only Mode',
            onAction: () => navigateToReadOnlyView(projectRequestId)
          }
        );
      } else {
        showErrorMessage(message);
      }
    } else {
      showErrorMessage('Failed to update project request. Please try again.');
    }
    throw error;
  }
};
```

**When non-admin tries to change status of approved project:**

```javascript
const handleStatusChange = async (projectRequestId, newStatus) => {
  try {
    const response = await axios.put(
      `/api/project-requests/${projectRequestId}`,
      { status: newStatus },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    showSuccessMessage(`Status updated to ${newStatus}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Access denied';
      
      if (message.includes('change status of approved')) {
        showErrorMessage(
          'Cannot change status of approved project requests. Only administrators can modify the status.',
          {
            action: 'Contact Admin',
            onAction: () => showAdminContactInfo()
          }
        );
      } else {
        showErrorMessage(message);
      }
    }
    throw error;
  }
};
```

---

## Helper Functions

### Complete Permission Checker

```javascript
// utils/projectRequestPermissions.js

export const getProjectRequestPermissions = (projectRequest, currentUser) => {
  const isOwner = projectRequest.submittedBy?.toString() === currentUser.id?.toString();
  const isAdmin = currentUser.role === 'admin';
  const isMentorOrHigher = ['mentor', 'researcher', 'admin'].includes(currentUser.role);
  const isApproved = projectRequest.status === 'approved';
  
  return {
    // Can edit project request (update fields)
    canEdit: isAdmin || (isOwner && !isApproved && projectRequest.status !== 'rejected') || 
             (isMentorOrHigher && !isApproved),
    
    // Can change status
    canChangeStatus: isAdmin || (isMentorOrHigher && !isApproved),
    
    // Can view document
    canViewDocument: isAdmin || isOwner || isMentorOrHigher,
    
    // Can delete project request
    canDelete: isAdmin || (isOwner && projectRequest.status !== 'approved' && projectRequest.status !== 'under_review'),
    
    // Can approve project
    canApprove: isMentorOrHigher && !isApproved,
    
    // Can reject project
    canReject: isMentorOrHigher && !isApproved,
    
    // Is read-only (for display purposes)
    isReadOnly: isApproved && !isAdmin,
    
    // Show admin badge
    showAdminBadge: isApproved && isAdmin,
  };
};

// Usage in component
const permissions = getProjectRequestPermissions(projectRequest, currentUser);

{permissions.canEdit && (
  <Button onClick={handleEdit}>Edit</Button>
)}

{permissions.isReadOnly && (
  <Badge color="warning">Read-Only (Approved)</Badge>
)}

{permissions.showAdminBadge && (
  <Badge color="success">Admin-Only Editing</Badge>
)}
```

---

## Status Indicators & Badges

### Visual Status Indicators

```javascript
const getStatusBadge = (status, canEdit) => {
  const badges = {
    pending: { color: 'warning', text: 'Pending', icon: 'clock' },
    under_review: { color: 'info', text: 'Under Review', icon: 'eye' },
    approved: { 
      color: 'success', 
      text: 'Approved', 
      icon: 'check-circle',
      badge: canEdit ? 'Admin-Only Editing' : 'Read-Only'
    },
    rejected: { color: 'danger', text: 'Rejected', icon: 'times-circle' },
    on_hold: { color: 'secondary', text: 'On Hold', icon: 'pause' },
  };
  
  return badges[status] || badges.pending;
};

// In your component
const statusBadge = getStatusBadge(projectRequest.status, permissions.canEdit);

<Badge color={statusBadge.color}>
  <Icon name={statusBadge.icon} />
  {statusBadge.text}
  {statusBadge.badge && (
    <span className="ml-2">({statusBadge.badge})</span>
  )}
</Badge>
```

---

## Document View/Download Implementation

### Document Download Handler

```javascript
const handleViewDocument = async (projectRequestId) => {
  try {
    const response = await fetch(
      `/api/project-requests/${projectRequestId}/document`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view this document.');
      }
      if (response.status === 404) {
        throw new Error('Document not found for this project request.');
      }
      throw new Error('Failed to download document.');
    }
    
    // Check if it's a redirect (Cloudinary URL)
    if (response.redirected || response.url.includes('cloudinary.com')) {
      // Open in new tab for Cloudinary URLs
      window.open(response.url, '_blank');
      return;
    }
    
    // Handle file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Get filename from Content-Disposition header or use from project request
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'document.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else if (projectRequest.document?.originalName || projectRequest.document?.documentName) {
      filename = projectRequest.document.originalName || projectRequest.document.documentName;
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showSuccessMessage('Document downloaded successfully');
  } catch (error) {
    showErrorMessage(error.message || 'Failed to download document');
  }
};
```

---

## Form Validation & Submission

### Pre-submit Validation

```javascript
const handleSubmit = async (formData) => {
  // Check permissions before submission
  const permissions = getProjectRequestPermissions(projectRequest, currentUser);
  
  if (!permissions.canEdit) {
    showErrorMessage(
      'You do not have permission to edit this project request. Only administrators can modify approved projects.'
    );
    return;
  }
  
  try {
    const response = await axios.put(
      `/api/project-requests/${projectRequest.id}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    showSuccessMessage('Project request updated successfully');
    return response.data;
  } catch (error) {
    // Error handling as shown above
    handleUpdateError(error);
  }
};
```

---

## React Component Example

### Complete Project Request Card Component

```jsx
import React from 'react';
import { Button, Card, Badge, Alert } from 'your-ui-library';
import { getProjectRequestPermissions } from '../utils/projectRequestPermissions';

const ProjectRequestCard = ({ projectRequest, currentUser, onEdit, onViewDocument, onStatusChange }) => {
  const permissions = getProjectRequestPermissions(projectRequest, currentUser);
  const statusBadge = getStatusBadge(projectRequest.status, permissions.canEdit);
  
  return (
    <Card>
      <CardHeader>
        <h3>{projectRequest.title}</h3>
        <Badge color={statusBadge.color}>
          {statusBadge.text}
          {projectRequest.status === 'approved' && currentUser.role === 'admin' && (
            <span className="ml-2">(Admin-Only Editing)</span>
          )}
        </Badge>
      </CardHeader>
      
      <CardBody>
        {permissions.isReadOnly && (
          <Alert variant="warning">
            <strong>Read-Only Mode:</strong> This project request is approved and can only be edited by administrators.
          </Alert>
        )}
        
        <p>{projectRequest.description}</p>
        
        {/* Document Section */}
        {projectRequest.document && permissions.canViewDocument && (
          <div className="mb-3">
            <Button onClick={() => onViewDocument(projectRequest._id)} variant="outline">
              <Icon name="file-pdf" />
              View Document: {projectRequest.document.originalName || projectRequest.document.documentName}
              {(projectRequest.document.size || projectRequest.document.bytes) && (
                <span className="ml-2">
                  ({(projectRequest.document.size || projectRequest.document.bytes) / 1024 / 1024} MB)
                </span>
              )}
            </Button>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="d-flex gap-2">
          {permissions.canEdit && (
            <Button onClick={() => onEdit(projectRequest._id)} color="primary">
              Edit Project Request
            </Button>
          )}
          
          {permissions.canChangeStatus && (
            <Select
              value={projectRequest.status}
              onChange={(e) => onStatusChange(projectRequest._id, e.target.value)}
              size="sm"
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
            </Select>
          )}
          
          {currentUser.role === 'admin' && projectRequest.status === 'approved' && (
            <Badge color="info">
              Admin has full editing access
            </Badge>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default ProjectRequestCard;
```

---

## Error Messages Reference

### Backend Error Messages (for UI display)

| Error Message | Status Code | When It Occurs | UI Action |
|--------------|-------------|----------------|-----------|
| `Cannot update approved project requests. Only administrators can modify approved projects.` | 403 | Non-admin tries to update approved project | Show read-only message, disable form |
| `Cannot change status of approved project requests. Only administrators can modify the status of approved projects.` | 403 | Non-admin tries to change status of approved project | Hide status selector, show admin-only message |
| `Access denied. You can only view documents for your own project requests or need mentor+ privileges` | 403 | Unauthorized user tries to view document | Hide document button |
| `Document not found for this project request` | 404 | Document doesn't exist | Hide document button or show "No document" |

---

## Testing Checklist for Frontend

- [ ] Edit button is hidden for non-admin when project is approved
- [ ] Edit button is shown for admin when project is approved
- [ ] Form fields are disabled for non-admin when project is approved
- [ ] Status dropdown is hidden for non-admin when project is approved
- [ ] Status dropdown is shown for admin when project is approved
- [ ] Admin can change status from approved to any other status
- [ ] Admin can change status to approved from any status
- [ ] Warning message is shown for non-admin viewing approved project
- [ ] Document button is always visible for admin
- [ ] Document button is visible for owner/mentors
- [ ] Document download works for Cloudinary URLs (opens in new tab)
- [ ] Document download works for local files (downloads file)
- [ ] Error messages are displayed correctly
- [ ] Read-only mode is clearly indicated in UI

---

## Summary

**Key Frontend Changes Required:**

1. ✅ **Hide edit buttons** for non-admin users when `status === 'approved'`
2. ✅ **Show edit buttons** only for admins when `status === 'approved'`
3. ✅ **Disable form fields** for non-admin users on approved projects
4. ✅ **Show status selector** only for admins on approved projects
5. ✅ **Display warning messages** for read-only mode
6. ✅ **Handle document downloads** for both Cloudinary URLs and local files
7. ✅ **Handle error responses** with appropriate user messages
8. ✅ **Show visual indicators** (badges, alerts) for approval status and permissions

**Administrator Privileges:**
- ✅ Full editing access on approved projects
- ✅ Can change status even on approved projects
- ✅ Can always view documents
- ✅ Full access to all project requests

---

**Status:** Ready for Frontend Implementation  
**Priority:** High - Required for production deployment
