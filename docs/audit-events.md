# Audit Event Schema Versioning

This document describes the schema versioning strategy, compatibility policy, and migration guide for audit events in ChronoPay-Backend.

## Overview

Audit events in ChronoPay-Backend follow a versioned schema to ensure backward compatibility, enable safe schema evolution, and support audit log consumers across different versions.

## Current Schema Version

- **Current Version**: `1.0.0`
- **Supported Versions**: `["1.0.0"]`
- **Deprecated Versions**: `[]`

## Event Envelope Structure

All audit events use a stable envelope structure that contains version information and metadata:

```typescript
interface AuditEventEnvelope {
  version: string;           // Schema version (e.g., "1.0.0")
  timestamp: string;         // ISO 8601 timestamp
  eventId: string;          // UUID v4 for unique identification
  action: string;           // Action being performed (max 256 chars)
  actorIp?: string;         // Actor IP address (IPv4/IPv6)
  resource?: string;        // Resource being accessed (max 2048 chars)
  status: number | string;  // HTTP status code or status string
  data: Record<string, unknown>; // Version-specific payload
  service: string;          // Service name
  environment: string;      // Environment (dev, staging, prod)
}
```

## Schema Version 1.0.0

### Payload Structure

```typescript
interface AuditEventPayloadV1 extends Record<string, unknown> {
  method?: string;          // HTTP method (GET, POST, PUT, DELETE, PATCH)
  body?: Record<string, unknown>;  // Request/response body
  context?: Record<string, unknown>; // Additional context
  // ... other custom fields
}
```

### Validation Rules

- **version**: Must be a valid semantic version string
- **timestamp**: Must be a valid ISO 8601 date string
- **eventId**: Must be a valid UUID v4
- **action**: Maximum 256 characters
- **actorIp**: Must be a valid IPv4 or IPv6 address if present
- **resource**: Maximum 2048 characters if present
- **status**: Required, must be a number or string
- **environment**: Must be one of: `dev`, `staging`, `prod`
- **method** (if present): Must be one of: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- **body/context** (if present): Must be objects
- **payload size**: Maximum 10KB when JSON serialized

## Data Redaction and Security

### Automatic Redaction

The following sensitive fields are automatically redacted with `***REDACTED***`:

- `password`, `passwd`
- `secret`
- `token`, `api_key`, `apiKey`
- `authorization`
- `credit_card`, `creditCard`
- `ssn`, `social_security_number`
- `pin`

### Additional Security Rules

- Strings longer than 256 characters are redacted
- Unknown data types (functions, symbols, etc.) are redacted
- Redaction is applied recursively to nested objects and arrays

### Example

```typescript
// Input
{
  username: "user@example.com",
  password: "secret123",
  metadata: {
    token: "abc123",
    normalField: "value"
  }
}

// Output (after redaction)
{
  username: "user@example.com",
  password: "***REDACTED***",
  metadata: {
    token: "***REDACTED***",
    normalField: "value"
  }
}
```

## Compatibility Policy

### Version Support Timeline

- **Current Version**: Fully supported, actively maintained
- **Deprecated Versions**: No longer recommended for new implementations
- **Unsupported Versions**: May be removed in future releases

### Backward Compatibility

- **Consumers**: New versions maintain backward compatibility with previous versions
- **Producers**: Old versions can still be read and validated
- **Migration**: Legacy audit entries are automatically migrated to the current version

### Forward Compatibility

- New fields added to future versions will be optional
- Unknown fields in newer versions are ignored by older consumers
- The envelope structure remains stable across versions

## Schema Evolution Guidelines

### When to Bump the Version

1. **Major Version (X.0.0 → Y.0.0)**: Breaking changes
   - Removing or renaming required fields
   - Changing field types in incompatible ways
   - Modifying the envelope structure

2. **Minor Version (1.0.0 → 1.1.0)**: Additive changes
   - Adding new optional fields
   - Adding new validation rules that don't break existing data
   - Extending the payload structure

3. **Patch Version (1.0.0 → 1.0.1)**: Bug fixes
   - Fixing validation logic
   - Updating documentation
   - Performance improvements

### Deprecation Process

1. Announce deprecation in release notes
2. Mark version as deprecated in `DEPRECATED_SCHEMA_VERSIONS`
3. Provide migration path for consumers
4. Wait at least 6 months before removing support

## Usage Examples

### Creating an Audit Event

```typescript
import { createAuditEvent, encodeAuditEvent } from "./utils/auditEventValidator.js";

// Create a versioned audit event
const event = createAuditEvent(
  "CREATE_USER",
  {
    method: "POST",
    body: { username: "test@example.com", password: "secret" },
    userId: "user123"
  },
  {
    actorIp: "127.0.0.1",
    resource: "/api/users",
    status: 201,
    service: "chronopay-backend",
    environment: "prod"
  }
);

// Encode to JSON for logging
const logLine = encodeAuditEvent(event);
console.log(logLine);
```

### Using the Audit Logger

```typescript
import { defaultAuditLogger } from "./services/auditLogger.js";

// New versioned format
await defaultAuditLogger.log(
  "LOGIN",
  {
    method: "POST",
    body: { username: "user@example.com", password: "secret" }
  },
  {
    actorIp: "192.168.1.1",
    resource: "/api/auth/login",
    status: 200
  }
);

// Legacy format (automatically migrated)
await defaultAuditLogger.log({
  action: "LEGACY_ACTION",
  actorIp: "192.168.1.1",
  status: 200,
  metadata: { method: "POST" }
});
```

### Using with Express Middleware

```typescript
import { auditMiddleware } from "./middleware/audit.js";

app.post("/api/users", auditMiddleware("CREATE_USER"), (req, res) => {
  // Handler logic
});
```

### Validating and Decoding Events

```typescript
import { decodeAuditEvent, validateAuditEvent } from "./utils/auditEventValidator.js";

// Decode from JSON
const event = decodeAuditEvent(jsonString);

// Validate
try {
  validateAuditEvent(event);
  console.log("Event is valid");
} catch (error) {
  if (error instanceof AuditEventValidationError) {
    console.error("Validation error:", error.message);
  } else if (error instanceof AuditEventVersionError) {
    console.error("Version error:", error.message);
  }
}
```

## Consumer Migration Guide

### For Audit Log Consumers

1. **Update to support the envelope structure**: Ensure your parser can handle the stable envelope fields
2. **Handle version field**: Check the `version` field to determine which payload schema to use
3. **Implement redaction**: Apply similar redaction rules when displaying or processing sensitive data
4. **Validate events**: Use the provided validator functions to ensure event integrity

### Example Consumer Implementation

```typescript
function processAuditEvent(jsonLine: string) {
  const event = JSON.parse(jsonLine);
  
  // Check version
  if (event.version === "1.0.0") {
    // Process v1.0.0 payload
    const payload = event.data as AuditEventPayloadV1;
    console.log(`Action: ${event.action}, Method: ${payload.method}`);
  } else {
    console.warn(`Unsupported version: ${event.version}`);
  }
  
  // Always use envelope fields
  console.log(`Timestamp: ${event.timestamp}`);
  console.log(`Event ID: ${event.eventId}`);
}
```

## Testing

### Running Tests

```bash
# Run audit-related tests
npm test -- src/__tests__/auditEventValidator.test.ts
npm test -- src/__tests__/auditLogger.test.ts
npm test -- src/__tests__/auditMiddleware.test.ts
```

### Test Coverage

The audit event implementation maintains 95%+ test coverage, including:
- Schema validation tests
- Redaction enforcement tests
- Version compatibility tests
- Security validation tests

## Security Considerations

1. **Sensitive Data**: Always redact sensitive fields before logging
2. **Payload Size**: Enforce size limits to prevent log flooding
3. **Validation**: Validate all events before processing
4. **UUIDs**: Use cryptographically random UUIDs for event IDs
5. **Timestamps**: Use ISO 8601 format for consistent parsing

## Troubleshooting

### Common Issues

**Issue**: `AuditEventValidationError: eventId must be a valid UUID v4`
- **Solution**: Ensure you're using UUID v4 format (e.g., `550e8400-e29b-41d4-a716-446655440000`)

**Issue**: `AuditEventVersionError: Unsupported schema version`
- **Solution**: Check that the version is in `SUPPORTED_SCHEMA_VERSIONS`

**Issue**: Payload size exceeds 10KB limit
- **Solution**: Reduce the amount of data in the payload or use data minimization

## References

- **Type Definitions**: `src/types/auditEvent.ts`
- **Validator/Encoder**: `src/utils/auditEventValidator.ts`
- **Audit Logger**: `src/services/auditLogger.ts`
- **Middleware**: `src/middleware/audit.ts`
- **Tests**: `src/__tests__/auditEventValidator.test.ts`
