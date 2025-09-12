# News Application API - Request & Response Examples

This document provides comprehensive examples of request bodies and responses for the news application APIs.

## 1. Create News with Application Form

### Request Body Examples

#### Basic News with Simple Application Form
```json
{
  "title": "Robotics Workshop 2024",
  "content": "Join our comprehensive robotics workshop covering Arduino programming, sensor integration, and autonomous navigation. This hands-on workshop is perfect for beginners and intermediate students interested in robotics.",
  "excerpt": "Learn robotics fundamentals with hands-on Arduino projects",
  "authorId": "68a30681af3f3b7d9e2653a3",
  "isPublished": true,
  "tags": ["robotics", "workshop", "arduino", "hands-on"],
  "featuredImageUrl": "https://example.com/images/robotics-workshop.jpg",
  "application": {
    "isEnabled": true,
    "type": "workshop",
    "requireLogin": false,
    "deadline": "2025-09-15T23:59:59.000Z",
    "maxApplicants": 30,
    "formFields": [
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true
      },
      {
        "name": "experience",
        "label": "Programming Experience",
        "type": "select",
        "required": true,
        "options": ["None", "Beginner", "Intermediate", "Advanced"]
      },
      {
        "name": "motivation",
        "label": "Why do you want to join this workshop?",
        "type": "textarea",
        "required": true
      }
    ]
  }
}
```

#### Advanced News with Complex Application Form
```json
{
  "title": "AI Competition 2024",
  "content": "Participate in our annual AI competition where teams will develop machine learning models to solve real-world problems. Winners will receive prizes and internship opportunities.",
  "excerpt": "Annual AI competition with prizes and internship opportunities",
  "authorId": "68a30681af3f3b7d9e2653a3",
  "isPublished": true,
  "isFeatured": true,
  "tags": ["ai", "competition", "machine-learning", "prizes"],
  "featuredImageUrl": "https://example.com/images/ai-competition.jpg",
  "featureOptions": {
    "showInNav": true,
    "navLabel": "AI Competition",
    "navOrder": 1
  },
  "application": {
    "isEnabled": true,
    "type": "competition",
    "requireLogin": true,
    "deadline": "2025-10-01T23:59:59.000Z",
    "maxApplicants": 50,
    "formFields": [
      {
        "name": "teamName",
        "label": "Team Name",
        "type": "text",
        "required": true
      },
      {
        "name": "teamMembers",
        "label": "Team Members (2-4 people)",
        "type": "textarea",
        "required": true
      },
      {
        "name": "projectIdea",
        "label": "Brief description of your project idea",
        "type": "textarea",
        "required": true
      },
      {
        "name": "technologies",
        "label": "Technologies you plan to use",
        "type": "checkbox",
        "required": true,
        "options": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "NLP", "Computer Vision", "Other"]
      },
      {
        "name": "experience",
        "label": "Team's ML/AI experience",
        "type": "radio",
        "required": true,
        "options": ["Beginner (0-1 year)", "Intermediate (1-3 years)", "Advanced (3+ years)"]
      },
      {
        "name": "github",
        "label": "GitHub Profile URL",
        "type": "url",
        "required": false
      },
      {
        "name": "phone",
        "label": "Contact Phone Number",
        "type": "phone",
        "required": true
      }
    ]
  }
}
```

#### Event with Application Form
```json
{
  "title": "Tech Career Fair 2024",
  "content": "Connect with leading tech companies and startups at our annual career fair. Network with industry professionals and explore internship and job opportunities.",
  "excerpt": "Annual tech career fair with networking opportunities",
  "authorId": "68a30681af3f3b7d9e2653a3",
  "isPublished": true,
  "tags": ["career", "networking", "jobs", "internships"],
  "application": {
    "isEnabled": true,
    "type": "event",
    "requireLogin": false,
    "deadline": "2025-09-20T23:59:59.000Z",
    "maxApplicants": 200,
    "formFields": [
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true
      },
      {
        "name": "graduationYear",
        "label": "Expected Graduation Year",
        "type": "select",
        "required": true,
        "options": ["2024", "2025", "2026", "2027", "Graduated"]
      },
      {
        "name": "interests",
        "label": "Areas of Interest",
        "type": "checkbox",
        "required": true,
        "options": ["Software Development", "Data Science", "AI/ML", "Cybersecurity", "DevOps", "Product Management", "Design", "Other"]
      },
      {
        "name": "resume",
        "label": "Resume URL (Google Drive/Dropbox)",
        "type": "url",
        "required": false
      }
    ]
  }
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "News article created successfully",
  "data": {
    "item": {
      "_id": "68b3721b80b1dec1edceaae9",
      "title": "Robotics Workshop 2024",
      "content": "Join our comprehensive robotics workshop...",
      "excerpt": "Learn robotics fundamentals with hands-on Arduino projects",
      "authorId": "68a30681af3f3b7d9e2653a3",
      "categoryId": null,
      "featuredImageUrl": "https://example.com/images/robotics-workshop.jpg",
      "tags": ["robotics", "workshop", "arduino", "hands-on"],
      "isFeatured": false,
      "isPublished": true,
      "publishedAt": "2025-08-30T21:50:19.000Z",
      "viewCount": 0,
      "featureOptions": {
        "showInNav": false,
        "navLabel": null,
        "navOrder": 0
      },
      "application": {
        "isEnabled": true,
        "type": "workshop",
        "requireLogin": false,
        "deadline": "2025-09-15T23:59:59.000Z",
        "maxApplicants": 30,
        "formFields": [
          {
            "name": "fullName",
            "label": "Full Name",
            "type": "text",
            "required": true,
            "options": []
          },
          {
            "name": "email",
            "label": "Email Address",
            "type": "email",
            "required": true,
            "options": []
          },
          {
            "name": "experience",
            "label": "Programming Experience",
            "type": "select",
            "required": true,
            "options": ["None", "Beginner", "Intermediate", "Advanced"]
          },
          {
            "name": "motivation",
            "label": "Why do you want to join this workshop?",
            "type": "textarea",
            "required": true,
            "options": []
          }
        ],
        "targetType": "Other",
        "targetId": null
      },
      "createdAt": "2025-08-30T21:50:19.000Z",
      "updatedAt": "2025-08-30T21:50:19.000Z"
    }
  }
}
```

## 2. Update News Application

### Request Body Examples

#### Update Application Configuration Only
```json
{
  "application": {
    "isEnabled": true,
    "type": "workshop",
    "requireLogin": true,
    "deadline": "2025-09-20T23:59:59.000Z",
    "maxApplicants": 25,
    "formFields": [
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true
      },
      {
        "name": "experience",
        "label": "Programming Experience",
        "type": "select",
        "required": true,
        "options": ["None", "Beginner", "Intermediate", "Advanced"]
      },
      {
        "name": "motivation",
        "label": "Why do you want to join this workshop?",
        "type": "textarea",
        "required": true
      },
      {
        "name": "availability",
        "label": "Available Time Slots",
        "type": "checkbox",
        "required": false,
        "options": ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)", "Evening (5 PM - 8 PM)"]
      }
    ]
  }
}
```

#### Update News Content and Application
```json
{
  "title": "Advanced Robotics Workshop 2024",
  "content": "Updated content: Join our advanced robotics workshop covering advanced topics including computer vision, machine learning for robotics, and autonomous navigation systems.",
  "excerpt": "Advanced robotics workshop with computer vision and ML",
  "isFeatured": true,
  "featureOptions": {
    "showInNav": true,
    "navLabel": "Robotics Workshop",
    "navOrder": 2
  },
  "application": {
    "isEnabled": true,
    "type": "workshop",
    "requireLogin": true,
    "deadline": "2025-09-25T23:59:59.000Z",
    "maxApplicants": 20,
    "formFields": [
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true
      },
      {
        "name": "experience",
        "label": "Programming Experience",
        "type": "select",
        "required": true,
        "options": ["Beginner", "Intermediate", "Advanced", "Expert"]
      },
      {
        "name": "motivation",
        "label": "Why do you want to join this workshop?",
        "type": "textarea",
        "required": true
      },
      {
        "name": "projects",
        "label": "Previous robotics projects (if any)",
        "type": "textarea",
        "required": false
      },
      {
        "name": "availability",
        "label": "Available Time Slots",
        "type": "checkbox",
        "required": true,
        "options": ["Weekend (Saturday)", "Weekend (Sunday)", "Weekday Evening"]
      }
    ]
  }
}
```

#### Disable Application Form
```json
{
  "application": {
    "isEnabled": false
  }
}
```

#### Update Deadline Only
```json
{
  "application": {
    "deadline": "2025-10-01T23:59:59.000Z"
  }
}
```

#### Update Max Applicants Only
```json
{
  "application": {
    "maxApplicants": 40
  }
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "News article updated successfully",
  "data": {
    "item": {
      "_id": "68b3721b80b1dec1edceaae9",
      "title": "Advanced Robotics Workshop 2024",
      "content": "Updated content: Join our advanced robotics workshop...",
      "excerpt": "Advanced robotics workshop with computer vision and ML",
      "authorId": "68a30681af3f3b7d9e2653a3",
      "categoryId": null,
      "featuredImageUrl": "https://example.com/images/robotics-workshop.jpg",
      "tags": ["robotics", "workshop", "arduino", "hands-on"],
      "isFeatured": true,
      "isPublished": true,
      "publishedAt": "2025-08-30T21:50:19.000Z",
      "viewCount": 0,
      "featureOptions": {
        "showInNav": true,
        "navLabel": "Robotics Workshop",
        "navOrder": 2
      },
      "application": {
        "isEnabled": true,
        "type": "workshop",
        "requireLogin": true,
        "deadline": "2025-09-25T23:59:59.000Z",
        "maxApplicants": 20,
        "formFields": [
          {
            "name": "fullName",
            "label": "Full Name",
            "type": "text",
            "required": true,
            "options": []
          },
          {
            "name": "email",
            "label": "Email Address",
            "type": "email",
            "required": true,
            "options": []
          },
          {
            "name": "experience",
            "label": "Programming Experience",
            "type": "select",
            "required": true,
            "options": ["Beginner", "Intermediate", "Advanced", "Expert"]
          },
          {
            "name": "motivation",
            "label": "Why do you want to join this workshop?",
            "type": "textarea",
            "required": true,
            "options": []
          },
          {
            "name": "projects",
            "label": "Previous robotics projects (if any)",
            "type": "textarea",
            "required": false,
            "options": []
          },
          {
            "name": "availability",
            "label": "Available Time Slots",
            "type": "checkbox",
            "required": true,
            "options": ["Weekend (Saturday)", "Weekend (Sunday)", "Weekday Evening"]
          }
        ],
        "targetType": "Other",
        "targetId": null
      },
      "createdAt": "2025-08-30T21:50:19.000Z",
      "updatedAt": "2025-08-30T21:50:23.000Z"
    }
  }
}
```

## 3. Apply to News Article

### Request Body Examples

#### Simple Application
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "responses": [
    {
      "fieldName": "fullName",
      "value": "John Doe"
    },
    {
      "fieldName": "email",
      "value": "john.doe@example.com"
    },
    {
      "fieldName": "experience",
      "value": "Intermediate"
    },
    {
      "fieldName": "motivation",
      "value": "I want to learn advanced robotics techniques and work on real-world projects."
    }
  ]
}
```

#### Complex Application with Multiple Field Types
```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+1987654321",
  "responses": [
    {
      "fieldName": "teamName",
      "value": "AI Innovators"
    },
    {
      "fieldName": "teamMembers",
      "value": "Jane Smith, Bob Johnson, Alice Brown"
    },
    {
      "fieldName": "projectIdea",
      "value": "We plan to develop a computer vision system for autonomous drone navigation using deep learning techniques."
    },
    {
      "fieldName": "technologies",
      "value": ["Python", "TensorFlow", "OpenCV", "Computer Vision"]
    },
    {
      "fieldName": "experience",
      "value": "Intermediate (1-3 years)"
    },
    {
      "fieldName": "github",
      "value": "https://github.com/janesmith"
    },
    {
      "fieldName": "phone",
      "value": "+1987654321"
    }
  ]
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Application submitted",
  "data": {
    "application": {
      "_id": "68b3721c80b1dec1edceaaf1",
      "newsId": "68b3721b80b1dec1edceaae9",
      "type": "workshop",
      "applicant": {
        "userId": null,
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890"
      },
      "responses": [
        {
          "fieldName": "fullName",
          "value": "John Doe"
        },
        {
          "fieldName": "email",
          "value": "john.doe@example.com"
        },
        {
          "fieldName": "experience",
          "value": "Intermediate"
        },
        {
          "fieldName": "motivation",
          "value": "I want to learn advanced robotics techniques and work on real-world projects."
        }
      ],
      "status": "submitted",
      "submittedAt": "2025-08-30T21:50:20.028Z",
      "createdAt": "2025-08-30T21:50:20.029Z",
      "updatedAt": "2025-08-30T21:50:20.029Z"
    }
  }
}
```

## 4. Error Response Examples

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Missing required fields: fullName, email"
  }
}
```

### Deadline Passed Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Application deadline has passed."
  }
}
```

### Max Applicants Reached Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Application limit reached."
  }
}
```

### Login Required Error (401)
```json
{
  "success": false,
  "error": {
    "message": "Login required to apply."
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": {
    "message": "News article not found"
  }
}
```

## 5. cURL Examples

### Create News with Application
```bash
curl -X POST http://localhost:3005/api/news/admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Robotics Workshop 2024",
    "content": "Join our comprehensive robotics workshop...",
    "authorId": "68a30681af3f3b7d9e2653a3",
    "isPublished": true,
    "application": {
      "isEnabled": true,
      "type": "workshop",
      "deadline": "2025-09-15T23:59:59.000Z",
      "maxApplicants": 30,
      "formFields": [
        {
          "name": "fullName",
          "label": "Full Name",
          "type": "text",
          "required": true
        },
        {
          "name": "email",
          "label": "Email Address",
          "type": "email",
          "required": true
        }
      ]
    }
  }'
```

### Update News Application
```bash
curl -X PUT http://localhost:3005/api/news/admin/68b3721b80b1dec1edceaae9 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application": {
      "deadline": "2025-09-20T23:59:59.000Z",
      "maxApplicants": 25,
      "formFields": [
        {
          "name": "fullName",
          "label": "Full Name",
          "type": "text",
          "required": true
        },
        {
          "name": "email",
          "label": "Email Address",
          "type": "email",
          "required": true
        },
        {
          "name": "experience",
          "label": "Experience Level",
          "type": "select",
          "required": true,
          "options": ["Beginner", "Intermediate", "Advanced"]
        }
      ]
    }
  }'
```

### Apply to News
```bash
curl -X POST http://localhost:3005/api/news/68b3721b80b1dec1edceaae9/apply \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "responses": [
      {
        "fieldName": "fullName",
        "value": "John Doe"
      },
      {
        "fieldName": "email",
        "value": "john.doe@example.com"
      },
      {
        "fieldName": "experience",
        "value": "Intermediate"
      }
    ]
  }'
```

## 6. Field Type Reference

| Type | Description | Example Value |
|------|-------------|---------------|
| `text` | Single line text | `"John Doe"` |
| `email` | Email address | `"john@example.com"` |
| `phone` | Phone number | `"+1234567890"` |
| `textarea` | Multi-line text | `"I want to learn robotics..."` |
| `select` | Dropdown selection | `"Intermediate"` |
| `radio` | Radio button group | `"Intermediate (1-3 years)"` |
| `checkbox` | Checkbox group | `["Python", "TensorFlow"]` |
| `url` | URL field | `"https://github.com/johndoe"` |
| `number` | Numeric field | `25` |

## 7. Application Status Values

| Status | Description |
|--------|-------------|
| `submitted` | Initial submission |
| `reviewed` | Under review |
| `accepted` | Application accepted |
| `rejected` | Application rejected |
| `waitlisted` | Application waitlisted |
| `withdrawn` | Application withdrawn |

These examples provide comprehensive coverage of all the news application API functionality with realistic use cases and proper error handling.
