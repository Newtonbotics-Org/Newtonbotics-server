# Inventory Checkout API Documentation

Complete API documentation for the enhanced inventory checkout system with tracking of users, checkout dates, expected return dates, and project associations.

---

## Overview

The inventory checkout system allows team members to checkout equipment, track who took it, when they took it, and when they're expected to return it. For project-related checkouts, items may never return (expectedReturnDate is optional).

**Key Features:**
- Track who checked out equipment (userId)
- Track when equipment was checked out (checkoutDate)
- Optional expected return date (for project use, may never return)
- Associate checkouts with projects
- View checkout history and active checkouts
- Support for partial returns
- Track who processed checkout/return (admin/inventory manager)

---

## Checkout Schema

Each checkout record includes:
- `userId`: User who checked out the equipment
- `quantity`: Number of items checked out
- `checkoutDate`: When the equipment was checked out (auto-set)
- `expectedReturnDate`: Optional - when item is expected back (null if for project)
- `actualReturnDate`: When item was actually returned
- `projectId`: Optional - associated project
- `projectName`: Snapshot of project name
- `status`: `checked_out`, `returned`, `overdue`, `lost`, or `project_use`
- `checkoutNotes`: Optional notes at checkout
- `returnNotes`: Optional notes at return
- `checkedOutBy`: Admin/inventory manager who processed checkout
- `returnedBy`: Admin/inventory manager who processed return

---

## API Endpoints

### 1. Checkout Equipment

**Endpoint:** `POST /api/inventory/equipment/:id/checkout`

**Access:** Team Member+ (requires authentication)

**Path Parameters:**
- `id` (required): Equipment ID

**Request Body:**
```json
{
  "quantity": 2,                                    // Required, min: 1
  "userId": "68f7475bc0e4bc43c9f52c15",            // Optional - if admin checking out for someone else
  "expectedReturnDate": "2025-12-31T00:00:00.000Z", // Optional - null if for project
  "projectId": "69093c190a4803a757ba0a97",         // Optional - if for a project
  "checkoutNotes": "For lab experiment"             // Optional, max 1000 chars
}
```

**Response:**
```json
{
  "success": true,
  "message": "Equipment checked out successfully",
  "data": {
    "checkout": {
      "id": "checkout_id",
      "userId": "68f7475bc0e4bc43c9f52c15",
      "userName": "John Doe",
      "quantity": 2,
      "checkoutDate": "2025-11-04T10:00:00.000Z",
      "expectedReturnDate": "2025-12-31T00:00:00.000Z",
      "projectId": "69093c190a4803a757ba0a97",
      "projectName": "Autonomous Robot Project",
      "status": "project_use"
    },
    "equipment": {
      "id": "equipment_id",
      "name": "Arduino Uno",
      "currentQuantity": 8
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/inventory/equipment/507f1f77bcf86cd799439011/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 2,
    "expectedReturnDate": "2025-12-31T00:00:00.000Z",
    "projectId": "69093c190a4803a757ba0a97",
    "checkoutNotes": "For autonomous navigation project"
  }'
```

---

### 2. Return Equipment

**Endpoint:** `PUT /api/inventory/equipment/:id/return`

**Access:** Team Member+ (requires authentication)

**Path Parameters:**
- `id` (required): Equipment ID

**Request Body:**
```json
{
  "checkoutId": "checkout_id",     // Optional - specific checkout to return
  "quantity": 1,                   // Optional - for partial returns
  "returnNotes": "Returned in good condition"  // Optional, max 1000 chars
}
```

**Response:**
```json
{
  "success": true,
  "message": "Equipment returned successfully",
  "data": {
    "checkout": {
      "id": "checkout_id",
      "returnedQuantity": 1,
      "actualReturnDate": "2025-11-15T10:00:00.000Z",
      "status": "returned"
    },
    "equipment": {
      "id": "equipment_id",
      "name": "Arduino Uno",
      "currentQuantity": 9
    }
  }
}
```

**Note:** If `checkoutId` is not provided, returns the most recent active checkout for the current user.

---

### 3. List All Checkouts

**Endpoint:** `GET /api/inventory/checkouts`

**Access:** Team Member+ (requires authentication)

**Query Parameters:**
- `equipmentId` (optional): Filter by equipment ID
- `userId` (optional): Filter by user ID
- `projectId` (optional): Filter by project ID
- `status` (optional): Filter by status (`checked_out`, `returned`, `overdue`, `lost`, `project_use`)
- `limit` (optional): Results per page (default: 20, max: 100)
- `skip` (optional): Skip N results (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "checkout_id",
        "userId": "68f7475bc0e4bc43c9f52c15",
        "quantity": 2,
        "checkoutDate": "2025-11-04T10:00:00.000Z",
        "expectedReturnDate": "2025-12-31T00:00:00.000Z",
        "actualReturnDate": null,
        "status": "checked_out",
        "projectId": "69093c190a4803a757ba0a97",
        "projectName": "Autonomous Robot Project",
        "equipmentId": "equipment_id",
        "equipmentName": "Arduino Uno",
        "checkoutNotes": "For project",
        "userNameSnapshot": "John Doe"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 20,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

### 4. Get My Checkout History

**Endpoint:** `GET /api/inventory/checkouts/my`

**Access:** Team Member+ (requires authentication)

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Results per page (default: 20, max: 100)
- `skip` (optional): Skip N results (default: 0)

**Response:** Same format as "List All Checkouts" but filtered to current user's checkouts.

---

### 5. Get Equipment Checkouts

**Endpoint:** `GET /api/inventory/equipment/:id/checkouts`

**Access:** Team Member+ (requires authentication)

**Path Parameters:**
- `id` (required): Equipment ID

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Results per page (default: 20, max: 100)
- `skip` (optional): Skip N results (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment": {
      "id": "equipment_id",
      "name": "Arduino Uno"
    },
    "items": [...],
    "pagination": {...}
  }
}
```

---

### 6. Get Active Checkouts for Equipment

**Endpoint:** `GET /api/inventory/equipment/:id/checkouts/active`

**Access:** Team Member+ (requires authentication)

**Path Parameters:**
- `id` (required): Equipment ID

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment": {
      "id": "equipment_id",
      "name": "Arduino Uno"
    },
    "activeCheckouts": [...],
    "count": 3
  }
}
```

---

### 7. Get Checkout Details

**Endpoint:** `GET /api/inventory/checkouts/:checkoutId`

**Access:** Team Member+ (requires authentication)
- Users can only view their own checkouts
- Admins and inventory managers can view any checkout

**Path Parameters:**
- `checkoutId` (required): Checkout ID

**Response:**
```json
{
  "success": true,
  "data": {
    "checkout": {
      "id": "checkout_id",
      "userId": "68f7475bc0e4bc43c9f52c15",
      "quantity": 2,
      "checkoutDate": "2025-11-04T10:00:00.000Z",
      "expectedReturnDate": "2025-12-31T00:00:00.000Z",
      "actualReturnDate": null,
      "status": "checked_out",
      "projectId": "69093c190a4803a757ba0a97",
      "projectName": "Autonomous Robot Project",
      "equipmentId": "equipment_id",
      "equipmentName": "Arduino Uno",
      "checkoutNotes": "For project",
      "returnNotes": null,
      "userNameSnapshot": "John Doe",
      "checkedOutBy": "admin_user_id",
      "returnedBy": null
    }
  }
}
```

---

## Use Cases

### Checkout for Personal Use
```json
{
  "quantity": 1,
  "expectedReturnDate": "2025-11-11T00:00:00.000Z",
  "checkoutNotes": "For personal project"
}
```

### Checkout for Project (May Never Return)
```json
{
  "quantity": 5,
  "projectId": "69093c190a4803a757ba0a97",
  "checkoutNotes": "For autonomous navigation project - may not return"
}
```

### Admin Checking Out for Someone Else
```json
{
  "quantity": 2,
  "userId": "68f7475bc0e4bc43c9f52c15",
  "expectedReturnDate": "2025-12-31T00:00:00.000Z"
}
```

### Partial Return
```json
{
  "checkoutId": "checkout_id",
  "quantity": 1,
  "returnNotes": "Returning 1 of 2 items"
}
```

---

## Status Values

- `checked_out`: Currently checked out
- `returned`: Has been returned
- `overdue`: Past expected return date (if set)
- `lost`: Marked as lost
- `project_use`: For project use (may never return)

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Insufficient quantity available",
  "data": {
    "available": 5,
    "requested": 10
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. You can only view your own checkouts."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Equipment not found"
}
```

---

## Notes

1. **Expected Return Date**: If `null`, the item is for project use and may never return
2. **Project Association**: When `projectId` is provided, status is automatically set to `project_use`
3. **Partial Returns**: You can return fewer items than checked out
4. **Admin Privileges**: Admins and inventory managers can checkout equipment for other users
5. **Checkout Tracking**: System tracks who processed the checkout/return (admin/inventory manager)
6. **User Snapshots**: User names are stored at checkout time for historical records

