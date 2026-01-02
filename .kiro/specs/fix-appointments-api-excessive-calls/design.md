# Design Document

## Overview

This document outlines the design for fixing excessive API calls to `/api/appointments/search`. The solution involves analyzing all call sources, optimizing React Query configuration, implementing request deduplication, and adding proper guards to prevent unnecessary refetches.

## Architecture

### Current Call Sources

1. **Appointments.jsx**
   - `useAppointmentsByDate(TODAY)` - Fetches today's appointments
   - `useAppointmentsRange(monthStartStr, monthEndStr)` - Fetches month range for calendar
   - Both hooks run on component mount and when dependencies change

2. **Patients.jsx**
   - `searchAppointmentsRaw` in highlight useEffect (line ~266)
   - `searchAppointmentsRaw` in flashAdd API useEffect (line ~367)
   - `searchAppointmentsRaw` in handleAction("intake") (line ~487)

3. **Potential Issues**
   - React Query refetching on window focus
   - React Query refetching on mount
   - Query invalidation triggering immediate refetch
   - Component re-renders causing hook re-execution
   - No deduplication for `searchAppointmentsRaw` calls

## Components and Interfaces

### 1. Enhanced React Query Configuration

```typescript
interface QueryOptions {
  staleTime: number;           // 5 minutes
  refetchOnWindowFocus: boolean; // false
  refetchOnMount: boolean;      // false if data exists
  refetchOnReconnect: boolean;  // false
  cacheTime: number;            // 10 minutes
}
```

### 2. Request Deduplication Cache

```typescript
interface RequestCache {
  key: string;                  // Serialized filter params
  promise: Promise<any>;        // In-flight request
  timestamp: number;            // When request started
  ttl: number;                  // Time to live (1 second)
}

interface DeduplicationManager {
  cache: Map<string, RequestCache>;
  get(key: string): Promise<any> | null;
  set(key: string, promise: Promise<any>): void;
  clear(key: string): void;
  cleanup(): void;              // Remove expired entries
}
```

### 3. API Call Logger

```typescript
interface APICallLog {
  timestamp: number;
  endpoint: string;
  params: any;
  source: string;               // Component/function name
  fromCache: boolean;
  duration?: number;
}

interface Logger {
  enabled: boolean;
  log(entry: APICallLog): void;
  getLogs(): APICallLog[];
  clear(): void;
}
```

## Data Models

### Query Keys Structure

```typescript
// Current
["appointments", "byDate", "2025-01-15"]
["appointments", "range", { fromDate: "2025-01-01", toDate: "2025-01-31" }]

// Ensure stable serialization
const createQueryKey = (type: string, params: any) => {
  return [
    "appointments",
    type,
    JSON.stringify(params, Object.keys(params).sort())
  ];
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Single API call per unique request
*For any* set of identical API parameters within a 1-second window, the system should make at most one actual HTTP request, with all callers receiving the same result.
**Validates: Requirements 6.1, 6.2**

### Property 2: Cache reuse within staleTime
*For any* React Query hook with cached data less than 5 minutes old, the system should return cached data without making a new API call.
**Validates: Requirements 2.5, 4.1, 4.2**

### Property 3: No refetch on window focus
*For any* React Query hook configured with `refetchOnWindowFocus: false`, when the browser window regains focus, the system should not trigger a new API call.
**Validates: Requirements 2.4, 4.3**

### Property 4: Invalidation without immediate refetch
*For any* mutation that invalidates queries with `refetchType: 'none'`, the system should mark cache as stale but not trigger an immediate refetch.
**Validates: Requirements 2.3, 4.5**

### Property 5: Ref guard prevents duplicate useEffect execution
*For any* useEffect with a ref guard, when the effect's dependencies change multiple times rapidly, the effect body should execute at most once until the guard is reset.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Stable query keys prevent cache misses
*For any* two React Query calls with semantically identical parameters, the system should generate identical query keys and reuse the same cache entry.
**Validates: Requirements 5.4**

## Error Handling

### Deduplication Errors
- If a deduplicated request fails, allow other callers to retry independently
- Clear failed request from cache immediately
- Log errors with request details for debugging

### Cache Corruption
- If cache data is corrupted, fall back to fresh API call
- Clear corrupted cache entry
- Log corruption event for monitoring

### Network Errors
- Retry failed requests with exponential backoff
- Don't cache failed requests
- Show user-friendly error messages

## Testing Strategy

### Unit Tests
- Test deduplication manager with simultaneous calls
- Test query key generation with various parameter orders
- Test ref guard behavior with rapid state changes
- Test cache cleanup with expired entries

### Property-Based Tests
- **Property 1 Test**: Generate random API parameters, make multiple simultaneous calls, verify only one HTTP request
- **Property 2 Test**: Generate random timestamps, verify cache is used when data is fresh
- **Property 5 Test**: Generate random rapid state changes, verify useEffect runs only once per guard reset

### Integration Tests
- Load Appointments page, verify at most 2 API calls
- Switch views, verify no additional API calls
- Create appointment, verify invalidation doesn't trigger refetch
- Check-in flow, verify single API call per flow

## Implementation Plan

### Phase 1: Analysis and Logging
1. Add API call logging to track all calls
2. Identify exact sources of duplicate calls
3. Measure baseline call count

### Phase 2: React Query Optimization
1. Update `useAppointmentsByDate` configuration
2. Update `useAppointmentsRange` configuration
3. Fix mutation invalidation to use `refetchType: 'none'`
4. Ensure stable query key generation

### Phase 3: Request Deduplication
1. Implement deduplication manager
2. Wrap `searchAppointmentsRaw` with deduplication
3. Add cache cleanup mechanism

### Phase 4: Component Optimization
1. Review Appointments.jsx for unnecessary re-renders
2. Review Patients.jsx useEffect dependencies
3. Add memoization where needed

### Phase 5: Verification
1. Test with logging enabled
2. Verify call count is reduced to expected levels
3. Performance testing
4. Remove or disable logging for production
