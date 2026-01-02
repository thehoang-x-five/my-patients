# Requirements Document

## Introduction

The `/api/appointments/search` endpoint is being called excessively (more than 10 times) when users interact with the Appointments page. This causes performance issues and unnecessary server load. The goal is to identify all sources of these API calls and implement proper caching, deduplication, and optimization strategies.

## Glossary

- **React Query**: Data fetching library used for managing server state
- **useAppointmentsByDate**: React Query hook that fetches appointments for a specific date
- **useAppointmentsRange**: React Query hook that fetches appointments for a date range
- **searchAppointmentsRaw**: Direct API call function (not cached by React Query)
- **staleTime**: Time in milliseconds before cached data is considered stale
- **refetchOnWindowFocus**: React Query option to refetch when window regains focus
- **invalidateQueries**: React Query method to mark cached data as stale

## Requirements

### Requirement 1

**User Story:** As a developer, I want to understand all sources of `/api/appointments/search` calls, so that I can identify which calls are necessary and which are duplicates.

#### Acceptance Criteria

1. WHEN analyzing the codebase THEN the system SHALL identify all locations where `/api/appointments/search` is called
2. WHEN analyzing React Query hooks THEN the system SHALL identify all hooks that trigger this API call
3. WHEN analyzing direct API calls THEN the system SHALL identify all `searchAppointmentsRaw` usages
4. WHEN documenting findings THEN the system SHALL categorize calls by component and trigger condition
5. WHEN documenting findings THEN the system SHALL identify which calls can be deduplicated

### Requirement 2

**User Story:** As a user, I want the Appointments page to load efficiently without making excessive API calls, so that the application performs well.

#### Acceptance Criteria

1. WHEN the Appointments page loads THEN the system SHALL make at most 2 API calls to `/api/appointments/search` (one for today, one for month range)
2. WHEN switching between list and calendar view THEN the system SHALL NOT trigger additional API calls if data is already cached
3. WHEN creating a new appointment THEN the system SHALL invalidate cache without triggering immediate refetch
4. WHEN the page is already loaded THEN the system SHALL NOT refetch on window focus
5. WHEN cached data is less than 5 minutes old THEN the system SHALL use cached data instead of refetching

### Requirement 3

**User Story:** As a user navigating from Appointments to Patients after check-in, I want the system to fetch appointment data efficiently, so that I don't experience delays.

#### Acceptance Criteria

1. WHEN checking in an appointment THEN the system SHALL call `searchAppointmentsRaw` at most once per check-in flow
2. WHEN the `highlightPid` changes THEN the system SHALL fetch appointments only once using the ref guard
3. WHEN the `flashAddAt` changes THEN the system SHALL fetch appointments only once using the ref guard
4. WHEN opening intake mode THEN the system SHALL fetch appointments only once per patient
5. WHEN multiple state changes occur simultaneously THEN the system SHALL deduplicate API calls

### Requirement 4

**User Story:** As a developer, I want React Query to be configured optimally, so that it doesn't cause unnecessary refetches.

#### Acceptance Criteria

1. WHEN configuring `useAppointmentsByDate` THEN the system SHALL set `staleTime` to at least 5 minutes
2. WHEN configuring `useAppointmentsRange` THEN the system SHALL set `staleTime` to at least 5 minutes
3. WHEN configuring both hooks THEN the system SHALL set `refetchOnWindowFocus` to false
4. WHEN configuring both hooks THEN the system SHALL set `refetchOnMount` to false if data exists
5. WHEN invalidating queries after mutations THEN the system SHALL use `refetchType: 'none'` to prevent automatic refetch

### Requirement 5

**User Story:** As a developer, I want to identify and fix any React component re-render issues that trigger unnecessary API calls, so that the application is efficient.

#### Acceptance Criteria

1. WHEN the Appointments component re-renders THEN the system SHALL NOT trigger new API calls if dependencies haven't changed
2. WHEN month state changes THEN the system SHALL only trigger `useAppointmentsRange` refetch, not `useAppointmentsByDate`
3. WHEN view mode changes (list/calendar) THEN the system SHALL NOT trigger any API calls
4. WHEN query keys are constructed THEN the system SHALL use stable values to prevent unnecessary cache misses
5. WHEN components unmount and remount THEN the system SHALL reuse cached data if still valid

### Requirement 6

**User Story:** As a developer, I want to implement request deduplication for `searchAppointmentsRaw` calls, so that simultaneous calls with the same parameters only hit the API once.

#### Acceptance Criteria

1. WHEN multiple components call `searchAppointmentsRaw` with identical parameters simultaneously THEN the system SHALL deduplicate to a single API call
2. WHEN a `searchAppointmentsRaw` call is in progress THEN subsequent calls with same parameters SHALL wait for the first call to complete
3. WHEN implementing deduplication THEN the system SHALL use a request cache with a short TTL (e.g., 1 second)
4. WHEN a request completes THEN the system SHALL share the result with all waiting callers
5. WHEN a request fails THEN the system SHALL allow retry without affecting other callers

### Requirement 7

**User Story:** As a developer, I want to add logging to track API calls, so that I can verify the fix is working correctly.

#### Acceptance Criteria

1. WHEN an API call to `/api/appointments/search` is made THEN the system SHALL log the call with timestamp and parameters
2. WHEN logging is enabled THEN the system SHALL include the call stack or component name
3. WHEN logging is enabled THEN the system SHALL track whether the call was from cache or network
4. WHEN logging is enabled THEN the system SHALL be easily disabled for production
5. WHEN analyzing logs THEN developers SHALL be able to identify duplicate calls and their sources
