# Contact API Documentation

The Contact API allows users to submit contact form messages that are automatically sent to your robotics club email address.

## Features

- ✅ Contact form submission with validation
- ✅ Automatic email notifications to robotics club
- ✅ User acknowledgement emails
- ✅ Database storage for message management
- ✅ Admin dashboard for managing submissions
- ✅ Statistics and reporting

## API Endpoints

### 1. Submit Contact Form

**POST** `/api/contact/submit`

Submit a new contact form message.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "General Inquiry",
  "message": "Hello, I have a question about your robotics club.",
  "phone": "+1-555-0123",
  "category": "General"
}
```

**Required Fields:**
- `name` - Sender's full name
- `email` - Sender's email address
- `subject` - Message subject
- `message` - Message content (max 1000 characters)

**Optional Fields:**
- `phone` - Phone number
- `category` - Message category (defaults to "General")

**Response:**
```json
{
  "success": true,
  "message": "Contact message submitted successfully. We will get back to you within 24-48 hours.",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. List Contact Submissions (Admin)

**GET** `/api/contact/submissions`

Retrieve all contact submissions with pagination and filtering.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (new, in_progress, resolved, closed)
- `priority` - Filter by priority (low, medium, high, urgent)
- `department` - Filter by department/category

**Response:**
```json
{
  "success": true,
  "data": {
    "submissions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 3. Get Submission Details

**GET** `/api/contact/submissions/:id`

Retrieve details of a specific contact submission.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "subject": "General Inquiry",
    "message": "Hello, I have a question...",
    "phone": "+1-555-0123",
    "category": "General",
    "status": "new",
    "priority": "medium",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Submission Status

**PUT** `/api/contact/submissions/:id`

Update the status, priority, or add a response to a contact submission.

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "64f8a1b2c3d4e5f6a7b8c9d0",
  "response": "We're working on your request and will get back to you soon."
}
```

### 5. Delete Submission

**DELETE** `/api/contact/submissions/:id`

Delete a contact submission (admin only).

### 6. Get Statistics

**GET** `/api/contact/stats`

Retrieve contact submission statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 45,
      "new": 12,
      "inProgress": 8,
      "resolved": 20,
      "closed": 5
    },
    "byDepartment": [
      { "_id": "General", "count": 25 },
      { "_id": "Technical", "count": 15 },
      { "_id": "Events", "count": 5 }
    ]
  }
}
```

## Email Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-robotics-club@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@newtonbotics.com

# Contact Form Configuration
ADMIN_NOTIFY_EMAIL=robotics@newtonbotics.com
ROBOTICS_CLUB_EMAIL=robotics@newtonbotics.com
```

### Email Flow

1. **User submits form** → Contact message saved to database
2. **Acknowledgement email** → Sent to user confirming receipt
3. **Notification email** → Sent to robotics club email with full details

### Email Templates

The system automatically generates professional HTML emails with:
- Sender information (name, email, phone)
- Message subject and content
- Category classification
- Timestamp
- NewtonBotics branding

## Frontend Integration

### HTML Form Example

```html
<form id="contactForm">
  <input type="text" name="name" placeholder="Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <input type="text" name="subject" placeholder="Subject" required>
  <select name="category">
    <option value="General">General</option>
    <option value="Technical">Technical Support</option>
    <option value="Events">Events</option>
    <option value="Partnership">Partnership</option>
  </select>
  <input type="tel" name="phone" placeholder="Phone (optional)">
  <textarea name="message" placeholder="Message" maxlength="1000" required></textarea>
  <button type="submit">Send Message</button>
</form>
```

### JavaScript Integration

```javascript
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Message sent successfully!');
      e.target.reset();
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Failed to send message. Please try again.');
  }
});
```

## Testing

Run the test script to verify the API:

```bash
npm install axios
node scripts/testContactAPI.js
```

## Security Features

- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- XSS protection
- SQL injection prevention
- CORS configuration

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (contact submitted)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Support

For technical support or questions about the Contact API, please contact the development team or refer to the main project documentation.
