# Project Requirements

## Milestone 1: Patient Portal & Notification Polish
- [ ] Fix delete record functionality on the patient record detail page (`/dashboard/patient/records/[id]`).
- [ ] Replace `alert()` with `ConfirmationModal` in the Urdu translation for record deletion.
- [ ] Fix `newPrescriptionReady` notification to show localized message instead of raw JSON.

## Milestone 2: Chat & Communication Fixes
- [ ] Implement conversation deletion in both doctor and patient portals.
- [ ] Fix real-time message fetching when user is outside the active conversation view (currently requires reload).

## Milestone 3: Feedback & Profile Integration
- [ ] Hide "Rate Experience" button after a review is submitted in the patient portal.
- [ ] Ensure ratings from appointments are correctly aggregated and displayed in the doctor's profile.
