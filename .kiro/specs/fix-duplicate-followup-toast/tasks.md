# Implementation Plan: Fix Duplicate Follow-up Toast Notifications

- [x] 1. Update followupContext.js utilities


  - Add `notified` and `createdAt` fields to context structure
  - Implement `markFollowupNotified()` function
  - Add expiration check in `getFollowupContext()`
  - Add backward compatibility for existing contexts
  - _Requirements: 1.3, 2.4, 4.1, 4.4_

- [x] 2. Update PatientModal.jsx handleFinishDoctor


  - Remove `toast.info()` call from follow-up flow (line 2179)
  - Keep context save with `saveFollowupContext()`
  - Keep flash animation trigger
  - Keep navigation logic
  - _Requirements: 1.1, 1.2_

- [x] 3. Update Appointments.jsx follow-up detection


  - Add `hasProcessedFollowupRef` ref for duplicate prevention
  - Add notified flag check before showing toast
  - Call `markFollowupNotified()` after showing toast
  - Update ref guard in useEffect
  - Ensure flash animation triggers regardless of notified status
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

- [x] 4. Test complete follow-up flow

  - Test: Complete exam with taiKham → verify single toast
  - Test: Re-navigate to Appointments → verify no duplicate toast
  - Test: Flash animation triggers correctly
  - Test: Context expiration after 1 hour
  - Test: Backward compatibility with old contexts
  - _Requirements: All_

- [x] 5. Checkpoint - Verify all tests pass


  - Ensure all tests pass, ask the user if questions arise.
