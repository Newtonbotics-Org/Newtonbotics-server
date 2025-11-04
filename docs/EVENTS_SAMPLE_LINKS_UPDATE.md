# Events API Update: sampleLinks field

This update adds a new optional field to Events for attaching resource links (practice questions, docs, etc.). It is available across create, update, and read endpoints.

## Field
- `sampleLinks` (optional): Array of objects
  - `label` (string, required, 1-100 chars)
  - `url` (string, required, max 500, must start with `http` or `https`)

Example snippet:
```json
"sampleLinks": [
  { "label": "Practice Set 1", "url": "https://example.com/practice-1" },
  { "label": "Reference Docs", "url": "https://docs.example.com/robotics" }
]
```

## Create Event
- Endpoint: `POST /api/events`
- Body additions:
  - Accepts `sampleLinks` as described above
- Validation:
  - `sampleLinks` must be an array if provided
  - Each item requires `label` (1-100) and `url` (http/https, <= 500)

Minimal example:
```json
{
  "title": "Intro to Robotics",
  "description": "Basics of robotics.",
  "type": "workshop",
  "startDate": "2025-11-20",
  "endDate": "2025-11-20",
  "sampleLinks": [
    { "label": "Practice Set 1", "url": "https://example.com/practice-1" },
    { "label": "Reference Docs", "url": "https://docs.example.com/robotics" }
  ]
}
```

## Update Event
- Endpoint: `PUT /api/events/:id`
- Body additions:
  - Accepts `sampleLinks` with the same shape and validation as create
- Partial updates: omit `sampleLinks` to keep as-is; send a full new array to replace existing items

Replace links example:
```json
{
  "sampleLinks": [
    { "label": "Slides", "url": "https://example.com/slides" }
  ]
}
```

## Get Event(s)
- Endpoints: `GET /api/events`, `GET /api/events/:id`
- Response now includes `sampleLinks` if present (array of `{ label, url }`).

Response excerpt:
```json
{
  "success": true,
  "data": {
    "item": {
      "_id": "...",
      "title": "Intro to Robotics",
      "sampleLinks": [
        { "label": "Practice Set 1", "url": "https://example.com/practice-1" }
      ]
    }
  }
}
```

## Frontend/Admin Panel Changes
- Event form/modal: add a repeatable list input for `sampleLinks` with fields:
  - `label` (text, required, 1–100)
  - `url` (text, required, must start with `http` or `https`)
- Allow users to add/remove link rows
- When submitting, include `sampleLinks` array in the payload for create/update
- Display on event detail page as a list of external links

Validation hints for UI:
- Prevent empty labels or URLs
- Enforce URL prefix `http://` or `https://`
- Limit label length to 100 characters

## Notes
- The field is optional; omit it if there are no links
- Sending an empty array will clear all previously saved links on update
- No role/permission changes were introduced for this field
