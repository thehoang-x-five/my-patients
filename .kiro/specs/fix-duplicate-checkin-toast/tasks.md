# Implementation Plan: Fix Duplicate Check-in Toast Notifications

- [x] 1. Update appStore.js to track notified state


  - Add `highlightNotified` flag to track if highlight toast was shown
  - Add `flashAddNotified` flag to track if flash add toast was shown
  - Add `markHighlightNotified()` action
  - Add `markFlashAddNotified()` action
  - Reset notified flags when clearing highlight/flashAdd
  - _Requirements: 2.2, 2.4, 4.1_



- [x] 2. Update Appointments.jsx handleCheckIn

  - Remove all `toast.info()` and `toast.success()` calls (lines 488, 499, 511, 518)
  - Keep UIStore state updates (setHighlightPid, flashAdd, setPatientPrefill)
  - Keep navigation logic


  - _Requirements: 1.1, 1.2_

- [x] 3. Update Patients.jsx highlight detection

  - Add `hasProcessedHighlightRef` ref for duplicate prevention
  - Check `highlightNotified` flag before showing toast


  - Call `markHighlightNotified()` after showing toast
  - Update ref guard in useEffect
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 3.1_

- [x] 4. Update Patients.jsx flashAdd detection

  - Add `hasProcessedFlashAddRef` ref for duplicate prevention

  - Check `flashAddNotified` flag before showing toast
  - Call `markFlashAddNotified()` after showing toast
  - Update ref guard in useEffect
  - Remove duplicate toast call (line 325)
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 3.2_



- [x] 5. Test complete check-in flow

  - Test: Check-in existing patient → verify single toast
  - Test: Check-in new patient → verify single toast
  - Test: Re-navigate to Patients → verify no duplicate toast
  - Test: Highlight and flash animations work correctly
  - _Requirements: All_

- [x] 6. Checkpoint - Verify all tests pass


  - Ensure all tests pass, ask the user if questions arise.
