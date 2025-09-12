# Admin News Update API

This document describes the admin-specific API endpoint for updating news articles in the Newton Robotics Server.

## Endpoint

```
PUT /api/news/admin/:id
```

## Authentication

**Required**: Admin authentication token

Include the admin JWT token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

## URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | The ID of the news article to update |

## Request Body

All fields are **optional** - only include the fields you want to update.

### Available Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | String | 5-255 characters | The title of the news article |
| `content` | String | 20-10,000 characters | The main content of the news article |
| `excerpt` | String | Max 500 characters | A brief summary of the article |
| `authorId` | String | Valid ObjectId | The ID of the user who authored the article |
| `categoryId` | String | Valid ObjectId | The ID of the news category |
| `isPublished` | Boolean | - | Whether the article is published |
| `isFeatured` | Boolean | - | Whether the article is featured |
| `publishedAt` | Date | ISO 8601 format | Publication date |
| `tags` | Array | Array of strings | Tags for categorizing the article |
| `featuredImageUrl` | String | Max 500 characters | URL to the featured image |
| `featureOptions` | Object | - | Navigation and display options |
| `application` | Object | - | Application form configuration |

### Feature Options Object

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `showInNav` | Boolean | - | Show in navigation menu |
| `navOrder` | Number | Min 0 | Navigation order |
| `navLabel` | String | Max 50 characters | Navigation label |

### Application Object

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `isEnabled` | Boolean | - | Enable application form |
| `type` | String | 'workshop', 'event', 'competition', 'other' | Application type |
| `requireLogin` | Boolean | - | Require user login to apply |
| `deadline` | Date | ISO 8601 format | Application deadline |
| `maxApplicants` | Number | Min 1 | Maximum number of applicants |
| `targetType` | String | 'Workshop', 'Event', 'Competition', 'Other' | Target entity type |
| `targetId` | String | Valid ObjectId | Target entity ID |
| `formFields` | Array | - | Custom form fields |

### Form Fields Array

Each form field object can contain:

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `name` | String | 1-100 characters | Field identifier |
| `label` | String | 1-255 characters | Display label |
| `type` | String | Field types (see below) | Input type |
| `required` | Boolean | - | Whether field is required |
| `options` | Array | Array of strings | Options for select/radio fields |

**Supported Field Types:**
- `text` - Single line text input
- `email` - Email input
- `phone` - Phone number input
- `textarea` - Multi-line text input
- `select` - Dropdown selection
- `radio` - Radio button group
- `checkbox` - Checkbox group
- `url` - URL input
- `number` - Numeric input

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "News article updated successfully",
  "data": {
    "item": {
      "_id": "68b36a9b9ba59c26eb96d109",
      "title": "Updated: Advanced Robotics Workshop 2024",
      "content": "Updated content: Join us for an intensive 3-day workshop...",
      "excerpt": "Updated: Intensive 3-day workshop on advanced robotics and AI with ROS2",
      "authorId": "68a30681af3f3b7d9e2653a3",
      "categoryId": "68a5b781804d614ae3e4cd84",
      "isPublished": true,
      "isFeatured": true,
      "publishedAt": "2025-08-30T21:18:19.376Z",
      "tags": ["robotics", "workshop", "AI", "machine learning", "ROS2"],
      "featuredImageUrl": "https://example.com/images/updated-robotics-workshop.jpg",
      "featureOptions": {
        "showInNav": true,
        "navLabel": "Updated Workshops",
        "navOrder": 2
      },
      "application": {
        "isEnabled": true,
        "type": "workshop",
        "requireLogin": true,
        "deadline": "2024-12-31T23:59:59.000Z",
        "maxApplicants": 30,
        "formFields": [...]
      },
      "viewCount": 0,
      "createdAt": "2025-08-30T20:52:30.965Z",
      "updatedAt": "2025-08-30T21:18:19.380Z"
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
    "details": [
      {
        "field": "title",
        "message": "Title must be between 5 and 255 characters"
      }
    ]
  }
}
```

#### 400 Bad Request - Author Not Found
```json
{
  "success": false,
  "error": {
    "message": "Author not found"
  }
}
```

#### 400 Bad Request - Category Not Found
```json
{
  "success": false,
  "error": {
    "message": "Category not found"
  }
}
```

#### 404 Not Found - News Article Not Found
```json
{
  "success": false,
  "error": {
    "message": "News article not found"
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Access token required"
  }
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Admin access required"
  }
}
```

## Example Usage

### Full Update

```bash
curl -X PUT http://localhost:3005/api/news/admin/68b36a9b9ba59c26eb96d109 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Advanced Robotics Workshop 2024",
    "content": "Updated content: Join us for an intensive 3-day workshop...",
    "excerpt": "Updated: Intensive 3-day workshop on advanced robotics and AI with ROS2",
    "isPublished": true,
    "isFeatured": true,
    "tags": ["robotics", "workshop", "AI", "machine learning", "ROS2"],
    "featureOptions": {
      "showInNav": true,
      "navLabel": "Updated Workshops",
      "navOrder": 2
    }
  }'
```

### Partial Update (Only Title and Tags)

```bash
curl -X PUT http://localhost:3005/api/news/admin/68b36a9b9ba59c26eb96d109 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title Only",
    "tags": ["updated", "tags", "only"]
  }'
```

### Publish/Unpublish Article

```bash
# Publish an article
curl -X PUT http://localhost:3005/api/news/admin/68b36a9b9ba59c26eb96d109 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'

# Unpublish an article
curl -X PUT http://localhost:3005/api/news/admin/68b36a9b9ba59c26eb96d109 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": false
  }'
```

### Update Application Form

```bash
curl -X PUT http://localhost:3005/api/news/admin/68b36a9b9ba59c26eb96d109 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "application": {
      "isEnabled": true,
      "type": "workshop",
      "requireLogin": true,
      "deadline": "2024-12-31T23:59:59.000Z",
      "maxApplicants": 25,
      "formFields": [
        {
          "name": "experience",
          "label": "Experience Level",
          "type": "select",
          "required": true,
          "options": ["Beginner", "Intermediate", "Advanced"]
        },
        {
          "name": "goals",
          "label": "Learning Goals",
          "type": "textarea",
          "required": true
        }
      ]
    }
  }'
```

## JavaScript/Fetch Example

```javascript
const updateNewsArticle = async (newsId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3005/api/news/admin/${newsId}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('News updated:', result.data.item);
      return result.data.item;
    } else {
      console.error('Error:', result.error);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};

// Usage examples
const newsId = '68b36a9b9ba59c26eb96d109';

// Full update
const fullUpdate = {
  title: "Updated Title",
  content: "Updated content...",
  isPublished: true,
  tags: ["updated", "tags"]
};

// Partial update
const partialUpdate = {
  title: "Only Title Updated"
};

// Publish toggle
const publishToggle = {
  isPublished: true
};

updateNewsArticle(newsId, fullUpdate);
```

## Testing

Use the provided test script to verify the API:

```bash
# Set environment variables
export ADMIN_TOKEN="your_admin_jwt_token"
export API_BASE_URL="http://localhost:3005"

# Run the test
node scripts/testAdminNewsUpdateAPI.js
```

## Special Features

### Automatic publishedAt Handling

- If `isPublished` is set to `true` and no `publishedAt` is provided (and the article wasn't previously published), the current date will be automatically set
- If `isPublished` is set to `false`, `publishedAt` will be set to `null`

### Partial Updates

- Only include the fields you want to update
- Unspecified fields will remain unchanged
- This allows for efficient updates without sending the entire object

### Validation

- All field validations are applied to updates
- Database references (authorId, categoryId) are validated
- Form field validations are enforced for application forms

### Error Handling

- Comprehensive error messages for validation failures
- Proper HTTP status codes for different error types
- Detailed error information for debugging

## Notes

- The `updatedAt` timestamp is automatically managed by Mongoose
- The `viewCount` field is preserved during updates
- Admin users have full access to update all news fields
- The API validates that the provided `authorId` and `categoryId` exist in the database
- Application forms can be completely replaced or partially updated
- Navigation options can be updated independently of other fields
