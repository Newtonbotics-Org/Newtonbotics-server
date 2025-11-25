# Attendance API

Administrative endpoints that allow NewtonBotics admins to record, update, list, and delete attendance information for team members. Non-admin users can only read their own attendance records via the `/mine` helper route.

> Base URL: `/api/attendance`

## Security & Roles

| Endpoint | Required Role |
|----------|---------------|
| `POST /api/attendance` | Admin (`admin` role or `system:admin` permission) |
| `GET /api/attendance` | Admin |
| `GET /api/attendance/:id` | Admin **or** attendance owner |
| `PUT /api/attendance/:id` | Admin |
| `DELETE /api/attendance/:id` | Admin |
| `GET /api/attendance/mine` | Any authenticated user (returns only their records) |

All mutation endpoints additionally store an immutable snapshot of who marked the attendance.

## Data Model

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | Required. Must reference an active `team_member`. Unique per day. |
| `date` | Date | Required. Normalized to UTC midnight. |
| `status` | String | One of `present`, `absent`, `late`, `excused`, `remote`, `on_leave`. Defaults to `present`. |
| `notes` | String | Optional, 1000 chars max. |
| `checkInTime` / `checkOutTime` | Date | Optional ISO datetimes. `checkOutTime` must be after `checkInTime`. |
| `location` | String | Optional, 255 chars max. |
| `markedBy` | ObjectId | Admin who created/updated the record. Stored with a snapshot of their name/email. |
| `userSnapshot` | Object | Lightweight cache of the target user's name, email, role, department. |

Each `(userId, date)` pair is unique—attempting to mark attendance twice for the same day returns HTTP `409`.

## Endpoints

### 1. Create Attendance (`POST /api/attendance`)

```http
POST /api/attendance
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "64fdc73c2d91c4b1f9012345",
  "date": "2025-02-01",
  "status": "present",
  "notes": "Arrived early for workshop prep",
  "checkInTime": "2025-02-01T08:55:00Z"
}
```

**Response**

```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "data": {
    "attendance": {
      "id": "65b22e...",
      "userId": {
        "id": "64fdc73c2d91c4b1f9012345",
        "firstName": "Sam",
        "lastName": "Lee",
        "email": "sam@newtonbotics.org",
        "role": "team_member"
      },
      "status": "present",
      "date": "2025-02-01T00:00:00.000Z",
      "markedBy": {
        "id": "64fdbb9cd1...",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  }
}
```

### 2. List Attendance (`GET /api/attendance`)

Supports filtering and pagination for dashboards.

| Query | Type | Description |
|-------|------|-------------|
| `userId` | String | Filter by a specific team member |
| `status` | Enum | Filter by status |
| `from`, `to` | Date | Inclusive date range (ISO) |
| `limit` | Int | 1-100, default 20 |
| `skip` | Int | Default 0 |
| `sort` | Enum | `asc` or `desc` by date (default `desc`) |

### 3. View Single Record (`GET /api/attendance/:id`)

Admins can view any record; individual users can view records where they are the subject.

### 4. Update Attendance (`PUT /api/attendance/:id`)

Same payload rules as the POST endpoint, all fields optional. Updates refresh the `markedBy` snapshot to track who made the change.

### 5. Delete Attendance (`DELETE /api/attendance/:id`)

Removes the record entirely. Use with caution—consider soft-deleting in a future iteration if needed.

### 6. My Attendance (`GET /api/attendance/mine`)

Authenticated users can page through their own attendance history with the same query parameters as the admin list endpoint (minus `userId` and `status` filtering, which are implicit).

---

**Notes**

1. The admin check uses the existing `requireAdmin` middleware (admin role or `system:admin` permission).
2. Only `team_member` roles can have attendance recorded to keep the feature focused on internal operations.
3. Extendable: future enhancements can add CSV exports, summary stats, or attendance streak calculations by building on the shared `Attendance` model.

