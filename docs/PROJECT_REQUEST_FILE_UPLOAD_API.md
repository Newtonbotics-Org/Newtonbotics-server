# Project Request File Upload API

## Overview

The Project Request API now supports document uploads. Users can attach project-related documents (PDF, Word, Excel, PowerPoint, Text, Markdown) when creating or updating project requests.

**Last Updated:** January 19, 2026

---

## Changes Summary

### New Features
- ✅ Document upload support for project requests
- ✅ Document download endpoint for authorized users
- ✅ Document update/replacement capability
- ✅ Automatic file validation and size limits

### Modified Endpoints
- `POST /api/project-requests` - Now accepts file uploads
- `PUT /api/project-requests/:id` - Now accepts optional file uploads

### New Endpoints
- `GET /api/project-requests/:id/document` - Download project request document

---

## API Endpoints

### 1. Create Project Request with Document

**Endpoint:** `POST /api/project-requests`

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Project title (5-255 characters) |
| `description` | string | Yes | Project description (20-5000 characters) |
| `teamSize` | integer | Yes | Team size (1-20) |
| `estimatedDurationMonths` | integer | Yes | Estimated duration in months (1-24) |
| `document` | file | No | Project document file (optional) |
| `objectives` | array[string] | No | Project objectives |
| `expectedOutcomes` | array[string] | No | Expected outcomes |
| `budgetEstimate` | number | No | Budget estimate |
| `requiredResources` | array[string] | No | Required resources |
| `teamMembers` | array[object] | No | Team members array |
| `resources` | array[object] | No | Resources array |

**File Restrictions:**
- **Allowed file types:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD
- **Maximum file size:** 10MB
- **Field name:** `document`

**Example Request (JavaScript/Fetch):**

```javascript
const formData = new FormData();
formData.append('title', 'AI-Powered Robot Navigation System');
formData.append('description', 'A comprehensive project to develop an AI-powered navigation system for autonomous robots using machine learning algorithms...');
formData.append('teamSize', '5');
formData.append('estimatedDurationMonths', '12');
formData.append('budgetEstimate', '50000');

// Optional: Add document
if (documentFile) {
  formData.append('document', documentFile);
}

fetch('/api/project-requests', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type header - browser will set it with boundary
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Project request created:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

**Example Request (React/Axios):**

```javascript
import axios from 'axios';

const createProjectRequest = async (formData, token) => {
  try {
    const response = await axios.post('/api/project-requests', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating project request:', error);
    throw error;
  }
};

// Usage
const formData = new FormData();
formData.append('title', 'My Project');
formData.append('description', 'Project description...');
formData.append('teamSize', '5');
formData.append('estimatedDurationMonths', '6');

// Add file if selected
if (selectedFile) {
  formData.append('document', selectedFile);
}

const result = await createProjectRequest(formData, authToken);
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Project request created",
  "data": {
    "item": {
      "_id": "65a1b2c3d4e5f6789012345",
      "title": "AI-Powered Robot Navigation System",
      "description": "A comprehensive project...",
      "teamSize": 5,
      "estimatedDurationMonths": 12,
      "document": {
        "filename": "project_proposal-1705689600000-123456789.pdf",
        "originalName": "Project Proposal.pdf",
        "path": "uploads/project-documents/project_proposal-1705689600000-123456789.pdf",
        "mimetype": "application/pdf",
        "size": 2457600,
        "uploadedAt": "2026-01-19T15:00:00.000Z"
      },
      "submittedBy": "64a1b2c3d4e5f6789012346",
      "status": "pending",
      "submittedAt": "2026-01-19T15:00:00.000Z",
      "createdAt": "2026-01-19T15:00:00.000Z",
      "updatedAt": "2026-01-19T15:00:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .md",
  "error": "Invalid file type. Allowed types: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .md"
}
```

```json
{
  "success": false,
  "message": "File too large. Maximum size is 10MB.",
  "error": "File too large. Maximum size is 10MB."
}
```

---

### 2. Update Project Request with Document

**Endpoint:** `PUT /api/project-requests/:id`

**Authentication:** Required (Bearer Token)

**Authorization:** Owner or Mentor+

**Content-Type:** `multipart/form-data` (if uploading file) or `application/json` (if not)

**Request Body:**

Same fields as POST, plus any fields you want to update. The `document` field is optional - if provided, it will replace any existing document.

**Example Request:**

```javascript
const formData = new FormData();
formData.append('description', 'Updated project description...');

// Optional: Replace existing document
if (newDocumentFile) {
  formData.append('document', newDocumentFile);
}

fetch(`/api/project-requests/${projectRequestId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Project request updated:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

**Note:** If a new document is uploaded, the old document file will be automatically deleted from the server.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Project request updated",
  "data": {
    "item": {
      "_id": "65a1b2c3d4e5f6789012345",
      "title": "AI-Powered Robot Navigation System",
      "description": "Updated project description...",
      "document": {
        "filename": "updated_proposal-1705689700000-987654321.pdf",
        "originalName": "Updated Proposal.pdf",
        "path": "uploads/project-documents/updated_proposal-1705689700000-987654321.pdf",
        "mimetype": "application/pdf",
        "size": 1800000,
        "uploadedAt": "2026-01-19T15:01:40.000Z"
      },
      "updatedAt": "2026-01-19T15:01:40.000Z"
    }
  }
}
```

---

### 3. Download Project Request Document

**Endpoint:** `GET /api/project-requests/:id/document`

**Authentication:** Required (Bearer Token)

**Authorization:** Owner, Mentor, Researcher, or Admin

**Description:** Downloads the document file associated with a project request.

**Example Request:**

```javascript
fetch(`/api/project-requests/${projectRequestId}/document`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error('Document not found or access denied');
  }
  return response.blob();
})
.then(blob => {
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition 
    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
    : 'document.pdf';
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
})
.catch(error => {
  console.error('Error downloading document:', error);
});
```

**Example Request (React/Axios with download):**

```javascript
import axios from 'axios';

const downloadDocument = async (projectRequestId, token, originalFilename) => {
  try {
    const response = await axios.get(
      `/api/project-requests/${projectRequestId}/document`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      }
    );
    
    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', originalFilename || 'document.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

// Usage
await downloadDocument(projectRequestId, authToken, 'Project Proposal.pdf');
```

**Success Response (200 OK):**

- Content-Type: Based on file type (e.g., `application/pdf`)
- Content-Disposition: `attachment; filename="original-filename.pdf"`
- Body: File binary data

**Error Responses:**

**404 Not Found (No document):**
```json
{
  "success": false,
  "message": "Document not found for this project request"
}
```

**404 Not Found (File not on server):**
```json
{
  "success": false,
  "message": "Document file not found on server"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. You can only view documents for your own project requests or need mentor+ privileges"
}
```

---

## Document Field Structure

The `document` field in project request responses has the following structure:

```typescript
interface ProjectRequestDocument {
  filename: string;        // Generated unique filename on server
  originalName: string;    // Original filename from user's device
  path: string;            // Relative path to file on server
  mimetype: string;        // MIME type of the file
  size: number;            // File size in bytes
  uploadedAt: string;      // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "document": {
    "filename": "project_proposal-1705689600000-123456789.pdf",
    "originalName": "Project Proposal.pdf",
    "path": "uploads/project-documents/project_proposal-1705689600000-123456789.pdf",
    "mimetype": "application/pdf",
    "size": 2457600,
    "uploadedAt": "2026-01-19T15:00:00.000Z"
  }
}
```

---

## Frontend Integration Guide

### React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const ProjectRequestForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamSize: '',
    estimatedDurationMonths: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ];
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
        setError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('teamSize', formData.teamSize);
      formDataToSend.append('estimatedDurationMonths', formData.estimatedDurationMonths);
      
      if (selectedFile) {
        formDataToSend.append('document', selectedFile);
      }

      const response = await axios.post('/api/project-requests', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Project request created:', response.data);
      // Reset form, show success message, etc.
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project request');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
      />
      
      {selectedFile && (
        <div>
          <p>Selected: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      
      {uploadProgress > 0 && (
        <div>
          <progress value={uploadProgress} max="100" />
          <span>{uploadProgress}%</span>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Project Request'}
      </button>
    </form>
  );
};

export default ProjectRequestForm;
```

### Displaying Document in Project Request Details

```jsx
const ProjectRequestDetails = ({ projectRequest }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/project-requests/${projectRequest._id}/document`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = projectRequest.document.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div>
      <h2>{projectRequest.title}</h2>
      <p>{projectRequest.description}</p>
      
      {projectRequest.document && (
        <div className="document-section">
          <h3>Project Document</h3>
          <p>File: {projectRequest.document.originalName}</p>
          <p>Size: {(projectRequest.document.size / 1024 / 1024).toFixed(2)} MB</p>
          <p>Type: {projectRequest.document.mimetype}</p>
          <button onClick={handleDownload}>Download Document</button>
        </div>
      )}
    </div>
  );
};
```

---

## Error Handling

### Common Errors

1. **File Too Large (400)**
   - **Message:** "File too large. Maximum size is 10MB."
   - **Solution:** Compress file or split into smaller files

2. **Invalid File Type (400)**
   - **Message:** "Invalid file type. Allowed types: .pdf, .doc, .docx, ..."
   - **Solution:** Convert file to allowed format

3. **Access Denied (403)**
   - **Message:** "Access denied. You can only view documents for your own project requests..."
   - **Solution:** Ensure user is owner or has mentor+ role

4. **Document Not Found (404)**
   - **Message:** "Document not found for this project request"
   - **Solution:** Check if project request has a document attached

---

## File Restrictions Summary

| Property | Value |
|----------|-------|
| **Max File Size** | 10MB |
| **Allowed Extensions** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .md |
| **Allowed MIME Types** | application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*, text/plain, text/markdown |
| **Field Name** | `document` |
| **Required** | No (optional) |

---

## Testing Checklist

- [ ] Upload PDF document with project request
- [ ] Upload Word document with project request
- [ ] Create project request without document (should work)
- [ ] Update project request with new document (replaces old)
- [ ] Update project request without document (keeps existing)
- [ ] Download document as owner
- [ ] Download document as mentor/admin
- [ ] Attempt to download document as unauthorized user (should fail)
- [ ] Attempt to upload file > 10MB (should fail)
- [ ] Attempt to upload invalid file type (should fail)
- [ ] Verify old document is deleted when replaced

---

## Notes

1. **File Storage:** Files are stored in `uploads/project-documents/` directory on the server. This directory is gitignored and will not be committed to version control.

2. **File Naming:** Server generates unique filenames to prevent conflicts. Format: `sanitized-name-timestamp-random.ext`

3. **File Replacement:** When updating a project request with a new document, the old document file is automatically deleted from the server.

4. **Content-Type:** When uploading files, use `multipart/form-data`. Do not manually set the `Content-Type` header when using FormData - the browser will set it automatically with the correct boundary.

5. **Authentication:** All endpoints require authentication via Bearer token in the Authorization header.

---

## Support

For questions or issues, please contact the backend team or refer to the main API documentation.
