# Implementation Plan - Cải thiện Flow Chẩn đoán và Tái khám

## Task List

- [x] 1. Tạo utility functions cho follow-up context
  - Tạo file `src/utils/followupContext.js`
  - Implement `saveFollowupContext()`, `getFollowupContext()`, `clearFollowupContext()`
  - Add expiry logic (1 hour)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Cập nhật data model trong PatientModal
  - [x] 2.1 Thay đổi `diagnosisData.followup` từ string sang `followupFlags` object
    - Update state initialization
    - Update all references to `diagnosisData.followup`
    - _Requirements: 3.2_
  
  - [x] 2.2 Sync flags giữa ExamDetail và PatientProcessMode
    - Pass `diagnosisData` và `setDiagnosisData` as props
    - Ensure bi-directional sync
    - _Requirements: 3.1, 3.3_

- [x] 3. Implement auto-load diagnosis trong PatientProcessMode
  - [x] 3.1 Add useEffect to auto-fetch on mount
    - Check if mode === "process" and maPhieuKham exists
    - Call `fetchFinalDiagnosis()` automatically
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Parse HuongXuTri field to populate flags
    - Extract checkbox states from saved diagnosis
    - Handle legacy text format
    - _Requirements: 3.4_
  
  - [x] 3.3 Add loading state and error handling
    - Show loading spinner during fetch
    - Display error message if fetch fails
    - _Requirements: 1.3, 1.4_

- [x] 4. Implement treatment direction validation
  - [x] 4.1 Create `validateTreatmentDirection()` function
    - Check at least one flag is true
    - Return boolean result
    - _Requirements: 2.1, 2.3_
  
  - [x] 4.2 Add validation to "Hoàn tất" button handler
    - Call validation before proceeding
    - Show error toast if validation fails
    - Prevent form submission
    - _Requirements: 2.2, 2.4_

- [x] 5. Implement follow-up flow handler


  - [x] 5.1 Detect "Tái khám" selection in completion handler


    - Check `followupFlags.taiKham`
    - Branch to follow-up flow
    - _Requirements: 4.1_
  

  - [x] 5.2 Save context to localStorage

    - Collect patient and doctor information
    - Call `saveFollowupContext()`
    - _Requirements: 4.1, 5.1_
  
  - [x] 5.3 Process medication payment if needed

    - Check if `rx.length > 0` and `totalDrugAmount > 0`
    - Call payment API
    - Handle payment errors
    - _Requirements: 4.2_
  

  - [x] 5.4 Navigate to Appointments page

    - Use `navigate("/appointments")`
    - Show info toast
    - _Requirements: 4.3_

- [x] 6. Update Appointments page


  - [x] 6.1 Detect follow-up context on mount

    - Call `getFollowupContext()` in useEffect
    - Set state to control highlight
    - _Requirements: 4.4, 5.5_
  

  - [x] 6.2 Highlight "Tạo lịch hẹn" button

    - Add conditional CSS classes
    - Use animation/pulse effect
    - Remove highlight after click
    - _Requirements: 6.1, 6.2, 6.3_



- [x] 7. Update AppointmentModal



  - [x] 7.1 Prefill form from context on first open

    - Check for context in useEffect
    - Populate patient ID, name, doctor info
    - Set appointment type to "tai_kham"
    - _Requirements: 4.5, 4.6_


  
  - [x] 7.2 Clear context after prefill


    - Call `clearFollowupContext()` after first use
    - Prevent duplicate prefills
    - _Requirements: 4.7, 5.4_

- [x] 8. Update ExamDetail checkboxes
  - [x] 8.1 Change treatment direction UI to checkboxes
    - Replace text input with checkbox group
    - Bind to `dx.flags` state
    - _Requirements: 3.2_
  
  - [x] 8.2 Sync checkbox changes to parent
    - Update `diagnosisData.followupFlags` on change
    - Ensure immediate sync
    - _Requirements: 3.1, 3.3_

- [ ] 9. Testing and validation
  - [ ] 9.1 Test auto-load diagnosis
    - Open "Xử lý chẩn đoán" tab
    - Verify diagnosis loads automatically
    - Test error handling
  
  - [ ] 9.2 Test validation
    - Try to complete without selecting direction
    - Verify error message appears
    - Verify form doesn't submit
  
  - [ ] 9.3 Test follow-up flow
    - Select "Tái khám" and complete
    - Verify navigation to Appointments
    - Verify button highlight
    - Verify form prefill
    - Verify context clears after use
  
  - [ ] 9.4 Test context expiry
    - Save context
    - Wait 1+ hour
    - Verify context is ignored

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

**Estimated Time**: 4-6 hours
**Priority**: High
**Dependencies**: None

## Progress Summary

### Completed (Tasks 1-4, 8):
✅ Created followup context utilities with localStorage management
✅ Updated data model from `followup: string` to `followupFlags: object`
✅ Added auto-load diagnosis when opening "Xử lý chẩn đoán" tab
✅ Implemented treatment direction validation (at least one checkbox required)
✅ Updated ExamDetail with checkbox UI for treatment directions
✅ Synced checkbox state between ExamDetail and PatientProcessMode

### Remaining (Tasks 5-7, 9-10):
⏳ Follow-up flow handler (save context, navigate to appointments)
⏳ Appointments page integration (highlight button, detect context)
⏳ AppointmentModal prefill from context
⏳ Testing and validation
