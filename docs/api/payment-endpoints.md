
# Payment System API Documentation

## Endpoints

### Payment Requests
```typescript
POST /payment-requests
GET /payment-requests
GET /payment-requests/:id
PATCH /payment-requests/:id
DELETE /payment-requests/:id
```

### Payment Analytics
```typescript
GET /payment-analytics/summary
GET /payment-analytics/collector-performance
GET /payment-analytics/payment-methods
```

### Payment Audit
```typescript
GET /payment-audit-logs
GET /payment-audit-logs/:payment_id
```

### Payment Archives
```typescript
GET /payment-archives
GET /payment-archives/:id
```

## Data Models

### Payment Request
```typescript
{
  id: string;
  member_id: string;
  collector_id: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes?: string;
  receipt_url?: string;
}
```

### Payment Audit Log
```typescript
{
  id: string;
  payment_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  old_state?: object;
  new_state?: object;
  metadata?: object;
}
```

### Analytics Summary
```typescript
{
  period_start: string;
  period_end: string;
  total_payments: number;
  total_amount: number;
  payment_method_breakdown: {
    cash: number;
    bank_transfer: number;
  };
  collector_breakdown: Record<string, number>;
  status_breakdown: {
    pending: number;
    approved: number;
  };
}
```

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting
- 100 requests per minute for normal endpoints
- 30 requests per minute for analytics endpoints
- 10 requests per minute for audit log endpoints

## Error Handling
Standard HTTP status codes are used:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
