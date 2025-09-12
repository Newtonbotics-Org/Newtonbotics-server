# Admin News Creation API

This document describes the admin-specific API endpoint for creating news articles in the Newton Robotics Server.

## Endpoint

```
POST /api/news/admin
```

## Authentication

**Required**: Admin authentication token

Include the admin JWT token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

## Request Body

### Required Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | String | 5-255 characters | The title of the news article |
| `content` | String | 20-10,000 characters | The main content of the news article |
| `authorId` | String | Valid ObjectId | The ID of the user who authored the article |

### Optional Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `excerpt` | String | Max 500 characters | A brief summary of the article |
| `categoryId` | String | Valid ObjectId | The ID of the news category |
| `isPublished` | Boolean | - | Whether the article is published (default: false) |
| `isFeatured` | Boolean | - | Whether the article is featured (default: false) |
| `publishedAt` | Date | ISO 8601 format | Publication date (auto-set if isPublished=true) |
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

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "News article created successfully",
  "data": {
    "item": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "New Research Breakthrough in Robotics",
      "content": "Our team has made significant progress...",
      "excerpt": "Major breakthrough in adaptive robotics technology",
      "authorId": "507f1f77bcf86cd799439012",
      "categoryId": "507f1f77bcf86cd799439013",
      "isPublished": true,
      "isFeatured": true,
      "publishedAt": "2024-01-15T10:30:00.000Z",
      "tags": ["robotics", "research", "breakthrough"],
      "featuredImageUrl": "https://example.com/images/robotics.jpg",
      "featureOptions": {
        "showInNav": true,
        "navLabel": "Research News",
        "navOrder": 1
      },
      "application": {
        "isEnabled": true,
        "type": "workshop",
        "requireLogin": true,
        "deadline": "2024-12-31T23:59:59.000Z",
        "maxApplicants": 50,
        "formFields": [...]
      },
      "viewCount": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
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

### Basic News Article

```bash
curl -X POST http://localhost:3000/api/news/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Research Breakthrough in Robotics",
    "content": "Our team has made significant progress in developing advanced robotic systems...",
    "excerpt": "Major breakthrough in adaptive robotics technology",
    "authorId": "507f1f77bcf86cd799439011",
    "isPublished": true,
    "tags": ["robotics", "research", "breakthrough"]
  }'
```

### News Article with Application Form

```bash
curl -X POST http://localhost:3000/api/news/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Robotics Workshop Registration Open",
    "content": "Join our advanced robotics workshop...",
    "authorId": "507f1f77bcf86cd799439011",
    "isPublished": true,
    "featureOptions": {
      "showInNav": true,
      "navLabel": "Workshops",
      "navOrder": 2
    },
    "application": {
      "isEnabled": true,
      "type": "workshop",
      "requireLogin": true,
      "deadline": "2024-12-31T23:59:59.000Z",
      "maxApplicants": 30,
      "formFields": [
        {
          "name": "experience",
          "label": "Years of Experience",
          "type": "number",
          "required": true
        },
        {
          "name": "interests",
          "label": "Areas of Interest",
          "type": "select",
          "required": true,
          "options": ["Machine Learning", "Computer Vision", "Control Systems"]
        }
      ]
    }
  }'
```

## Testing

Use the provided test script to verify the API:

```bash
# Set environment variables
export ADMIN_TOKEN="your_admin_jwt_token"
export API_BASE_URL="http://localhost:3000"

# Run the test
node scripts/testAdminNewsAPI.js
```

## Notes

- The `publishedAt` field is automatically set to the current date if `isPublished` is true and `publishedAt` is not provided
- The `viewCount` field is automatically initialized to 0
- The `createdAt` and `updatedAt` timestamps are automatically managed by Mongoose
- Admin users have full access to all news creation features, including application forms and advanced options
- The API validates that the provided `authorId` and `categoryId` exist in the database
