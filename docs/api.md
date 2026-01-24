# TaskFlow Pro API Documentation

## Base URL
- Development: `http://localhost:3001/api/v1`
- Production: `https://api.yourdomain.com/api/v1`

## Authentication

TaskFlow Pro uses JWT (JSON Web Tokens) for authentication with refresh token support.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Refresh
Access tokens expire in 15 minutes. Use the refresh endpoint to get new tokens.

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "isPhoneVerified": false
  },
  "accessToken": "jwt_token"
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### POST /auth/refresh
Refresh access token using refresh token (sent as httpOnly cookie).

#### POST /auth/logout
Logout user and clear refresh token.

#### POST /auth/verify
Verify email or phone with token.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

### Users

#### GET /users/profile
Get current user profile.

#### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### GET /users/stats
Get user statistics (task counts, completion rates).

### Tasks

#### GET /tasks
Get tasks with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE)
- `priority` (string): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `search` (string): Search in title and description
- `sortBy` (string): Sort field (createdAt, updatedAt, dueDate, title, priority, status)
- `sortOrder` (string): Sort order (asc, desc)
- `dueDateFrom` (string): Filter tasks due from date (ISO 8601)
- `dueDateTo` (string): Filter tasks due until date (ISO 8601)

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_id",
      "title": "Complete project",
      "description": "Finish the Q1 project",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "dueDate": "2024-02-15T10:00:00Z",
      "isVoiceCreated": false,
      "taskStakeholders": [
        {
          "stakeholder": {
            "id": "stakeholder_id",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
          }
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Finish the Q1 project proposal",
  "priority": "HIGH",
  "dueDate": "2024-02-15T10:00:00Z",
  "stakeholderIds": ["stakeholder_id_1", "stakeholder_id_2"]
}
```

#### POST /tasks/voice
Create a task from voice input.

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Finish the Q1 project proposal",
  "priority": "HIGH",
  "dueDate": "2024-02-15T10:00:00Z",
  "stakeholderIds": ["stakeholder_id_1"],
  "voiceMetadata": {
    "originalTranscript": "Create a high priority task...",
    "confidence": 0.95,
    "language": "en-US"
  }
}
```

#### GET /tasks/:id
Get a specific task by ID.

#### PATCH /tasks/:id
Update a task.

**Request Body:**
```json
{
  "title": "Updated title",
  "status": "COMPLETED",
  "stakeholderIds": ["stakeholder_id_1"]
}
```

#### DELETE /tasks/:id
Delete a task (soft delete).

#### GET /tasks/stats
Get task statistics by status.

**Response:**
```json
{
  "PENDING": 5,
  "IN_PROGRESS": 3,
  "COMPLETED": 12,
  "OVERDUE": 2
}
```

#### GET /tasks/overdue
Get overdue tasks.

#### GET /tasks/upcoming
Get upcoming tasks (next 7 days by default).

**Query Parameters:**
- `days` (number): Number of days to look ahead

### Stakeholders

#### GET /stakeholders
Get stakeholders with filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search` (string): Search in name, email, phone
- `organization` (string): Filter by organization
- `tags` (array): Filter by tags
- `sortBy`, `sortOrder`: Sorting

#### POST /stakeholders
Create a new stakeholder.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "organization": "Acme Corp",
  "tags": ["client", "vip"]
}
```

#### GET /stakeholders/:id
Get a specific stakeholder.

#### PATCH /stakeholders/:id
Update a stakeholder.

#### DELETE /stakeholders/:id
Delete a stakeholder.

#### GET /stakeholders/tags
Get all unique tags.

#### GET /stakeholders/organizations
Get all unique organizations.

### Reminders

#### GET /reminders
Get reminders with filtering.

**Query Parameters:**
- `status` (string): Filter by status
- `type` (string): Filter by type
- `taskId` (string): Filter by task ID

#### POST /reminders
Create a new reminder.

**Request Body:**
```json
{
  "taskId": "task_id",
  "type": "TASK_DUE",
  "scheduledAt": "2024-02-14T09:00:00Z",
  "message": "Task due tomorrow!"
}
```

#### GET /reminders/:id
Get a specific reminder.

#### PATCH /reminders/:id
Update a reminder.

#### DELETE /reminders/:id
Cancel a reminder.

#### GET /reminders/pending
Get pending reminders for next 24 hours.

#### GET /reminders/stats
Get reminder statistics.

### Calendar

#### GET /calendar/events
Get calendar events.

**Query Parameters:**
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `taskId` (string): Filter by task ID

#### POST /calendar/events
Create a calendar event.

**Request Body:**
```json
{
  "title": "Project Meeting",
  "description": "Discuss project progress",
  "startDate": "2024-02-15T10:00:00Z",
  "endDate": "2024-02-15T11:00:00Z",
  "location": "Conference Room A",
  "taskId": "task_id"
}
```

#### GET /calendar/month/:year/:month
Get month view of calendar.

#### GET /calendar/week?startDate=2024-02-12
Get week view of calendar.

#### GET /calendar/day?date=2024-02-15
Get day view of calendar.

#### POST /calendar/sync-task/:taskId
Sync task to calendar.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per minute
- Authentication: 5 requests per minute
- Burst allowance: 20 requests

## WebSocket Events

TaskFlow Pro supports real-time updates via WebSocket:

### Connection
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `reminder:sent` - Reminder sent
- `notification:new` - New notification

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @taskflow-pro/sdk
```

### Python
```bash
pip install taskflow-pro-sdk
```

## Postman Collection

Import the Postman collection from `/docs/TaskFlow-Pro.postman_collection.json` for easy API testing.