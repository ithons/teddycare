# TeddyCare API Documentation

This document describes the API endpoints available in TeddyCare.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Terra Integration](#terra-integration)
  - [Chat System](#chat-system)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

## Base URL

**Local Development**: `http://localhost:3000`  
**Production**: Not yet deployed

## Authentication

TeddyCare uses Clerk for authentication. All routes (except API endpoints explicitly marked as public) require user authentication.

### Authentication Flow

1. User signs in via Clerk
2. Clerk issues a JWT token
3. Middleware validates the token on each request
4. User's organization membership determines role-based access

### Protected Routes

- `/doctor/*` - Requires membership in the `doctor` organization
- `/patient/*` - Requires membership in the `patient` organization
- `/chat` - Requires authentication (any organization)

## API Endpoints

### Terra Integration

#### Generate Widget Session

Creates a Terra widget session for connecting health devices.

**Endpoint**: `GET /api/terra/generateWidgetSession`

**Authentication**: Required

**Request**: No body required

**Response**:
```json
{
  "url": "https://widget.tryterra.co/session/xxxxxxxxxxxxx",
  "expires_in": 3600
}
```

**Success Status**: `200 OK`

**Error Responses**:
- `400 Bad Request` - Missing Terra API credentials
- `500 Internal Server Error` - Terra API request failed

**Example Usage**:
```javascript
const response = await fetch('/api/terra/generateWidgetSession', {
  method: 'GET'
});
const data = await response.json();
window.open(data.url, '_blank');
```

**Configuration**:
- Reference ID: Configured via `TERRA_DEV_ID`
- Language: English (`en`)
- Redirect URLs: Configurable via environment

---

#### Terra Webhook Handler

Receives health data from Terra via webhooks.

**Endpoint**: `POST /api/terra/webhook`

**Authentication**: Verified via Terra signature header

**Headers**:
- `terra-signature`: Webhook signature for verification

**Request Body**: JSON payload from Terra (varies by data type)

**Example Body** (Body measurements):
```json
{
  "type": "body",
  "user": {
    "user_id": "mahdi",
    "provider": "FITBIT"
  },
  "data": [
    {
      "metadata": {
        "start_time": "2024-09-15T14:40:07.269Z",
        "end_time": "2024-09-16T14:40:07.269Z"
      },
      "measurements_data": {
        "measurements": [
          {
            "weight_kg": 79.93,
            "height_cm": 159.56,
            "BMI": 37.43,
            "bodyfat_percentage": 21.33
          }
        ]
      }
    }
  ]
}
```

**Response**:
```json
{
  "message": "Webhook received, processed, and stored"
}
```

**Success Status**: `200 OK`

**Error Responses**:
- `400 Bad Request` - Missing Terra signature
- `500 Internal Server Error` - Database or processing error

**Data Storage**:
All webhook data is stored in the `TerraData` table:
- `userId`: User identifier from Terra
- `type`: Data type (body, activity, sleep, etc.)
- `data`: Complete JSON payload as string
- `createdAt`: Timestamp of reception

---

### Chat System

The chat system uses Server Actions (not traditional REST endpoints) via the Vercel AI SDK.

#### Submit User Message

**Action**: `submitUserMessage(content: string)`

**Location**: `lib/chat/actions.tsx`

**Authentication**: Required (uses Clerk session)

**Parameters**:
- `content` (string): The user's message

**Returns**: Streaming AI response

**Behavior**:
1. Validates user session
2. Determines user role (doctor/patient) from organization
3. Fetches relevant health data from database
4. Constructs role-specific system prompt
5. Streams AI response using fine-tuned GPT-4o model

**System Prompts**:

**For Doctors**:
```
You are assisting a doctor like a nurse. Provide technical medical 
information and treatment suggestions based on this health information: 
{patient_metadata}. Today is {current_date}, use this and the birthday 
when calculating the patient's age. Additionally, here is the most 
recent health data for the patient: {health_data}. Only give health 
advice. Don't do anything else. Be professional and passionate.
```

**For Patients**:
```
You are assisting a patient like a nurse. Help diagnose any issues or 
give health advice in summary based on this personal health information: 
{patient_metadata}. Today is {current_date}, use this and the birthday 
when calculating the patient's age. Additionally, here is your most 
recent health data: {health_data}. Only give health advice. Don't do 
anything else. Be professional and passionate.
```

**Example Usage** (React Server Component):
```tsx
import { useActions, useUIState } from 'ai/rsc';
import { AI } from '@/lib/chat/actions';

function ChatComponent() {
  const { submitUserMessage } = useActions<typeof AI>();
  const [messages, setMessages] = useUIState<typeof AI>();

  const handleSubmit = async (message: string) => {
    const response = await submitUserMessage(message);
    setMessages([...messages, response]);
  };

  return (
    // Your chat UI
  );
}
```

## Data Models

### TerraData

Stores health data received from Terra webhooks.

**Schema**:
```prisma
model TerraData {
  id        String   @id @default(cuid())
  userId    String
  type      String
  data      String   // JSON string
  createdAt DateTime @default(now())
}
```

**Fields**:
- `id`: Unique identifier (auto-generated)
- `userId`: User ID from Terra
- `type`: Data type (body, activity, sleep, daily, nutrition, etc.)
- `data`: Complete webhook payload as JSON string
- `createdAt`: Timestamp of when data was received

**Querying Terra Data**:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get latest body data for a user
const latestBodyData = await prisma.terraData.findMany({
  where: {
    userId: 'mahdi',
    type: 'body',
  },
  orderBy: { createdAt: 'desc' },
  take: 1,
});

// Parse the JSON data
const parsedData = JSON.parse(latestBodyData[0].data);
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | Success |
| `400` | Bad Request - Invalid input or missing parameters |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error - Server-side error |

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/terra/generateWidgetSession');
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
    // Handle error appropriately
  }
  
  const data = await response.json();
  // Process successful response
} catch (error) {
  console.error('Network Error:', error);
  // Handle network errors
}
```

## Rate Limiting

Currently, TeddyCare does not implement rate limiting at the application level. However:

- **Clerk**: Has built-in rate limiting based on your plan
- **Tune Studio**: May have rate limits based on your API tier
- **Terra API**: Has rate limits documented in their API docs

## Webhooks Security

### Terra Webhook Verification

Terra webhooks include a signature header that should be verified:

```typescript
const signature = req.headers.get('terra-signature');
if (!signature) {
  return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
}

// Terra SDK automatically verifies the signature
// when processing the webhook
```

### Best Practices

1. Always verify webhook signatures
2. Use HTTPS in production
3. Store webhook secrets securely in environment variables
4. Log webhook failures for debugging
5. Implement idempotency for webhook processing

## API Versioning

Currently, TeddyCare does not implement API versioning. All endpoints are at the base API path.

For future versions, consider implementing versioning:
- `/api/v1/terra/webhook`
- `/api/v2/terra/webhook`

## Testing the API

### Using curl

```bash
# Test Terra widget session generation (requires authentication)
curl -X GET http://localhost:3000/api/terra/generateWidgetSession \
  -H "Cookie: your-clerk-session-cookie"

# Test webhook endpoint (requires Terra signature)
curl -X POST http://localhost:3000/api/terra/webhook \
  -H "Content-Type: application/json" \
  -H "terra-signature: your-signature" \
  -d '{"type":"body","user":{"user_id":"test"},"data":[]}'
```

### Using Postman

1. Import the endpoints into Postman
2. Set up authentication (Clerk session cookie)
3. Add required headers
4. Test each endpoint

## Related Documentation

- [Main README](README.md)
- [Setup Guide](SETUP.md)
- [Architecture Documentation](ARCHITECTURE.md)
