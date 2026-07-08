import toast from 'react-hot-toast';

const safeTranslate = (t: any, key: string, fallback: string) => {
  try {
    if (t && typeof t.has === 'function' && t.has(key)) {
      return t(key) || fallback;
    }
    return fallback;
  } catch (e) {
    return fallback;
  }
};

export const showToast = {
  patientAdded: (t: any) => toast.success(safeTranslate(t, 'toast.patientAdded', 'Patient added successfully')),
  patientRemoved: (t: any) => toast.success(safeTranslate(t, 'toast.patientRemoved', 'Patient removed successfully')),
  scheduleSaved: (t: any) => toast.success(safeTranslate(t, 'toast.scheduleSaved', 'Schedule saved successfully')),
  prescriptionSaved: (t: any) => toast.success(safeTranslate(t, 'toast.prescriptionSaved', 'Prescription saved successfully')),
  appointmentBooked: (t: any) => toast.success(safeTranslate(t, 'toast.appointmentBooked', 'Appointment booked successfully')),
  appointmentCancelled: (t: any) => toast.success(safeTranslate(t, 'toast.appointmentCancelled', 'Appointment cancelled successfully')),
  slotUnavailable: (t: any) => toast.error(safeTranslate(t, 'toast.slotUnavailable', 'This time slot is no longer available')),
  familyAdded: (t: any) => toast.success(safeTranslate(t, 'toast.familyAdded', 'Family member added successfully')),
  familyRemoved: (t: any) => toast.success(safeTranslate(t, 'toast.familyRemoved', 'Family member removed successfully')),
  profileUpdated: (t: any) => toast.success(safeTranslate(t, 'toast.profileUpdated', 'Profile updated successfully')),
  passwordChanged: (t: any) => toast.success(safeTranslate(t, 'toast.passwordChanged', 'Password changed successfully')),
  settingsSaved: (t: any) => toast.success(safeTranslate(t, 'toast.settingsSaved', 'Settings saved successfully')),
  doctorAdded: (t: any) => toast.success(safeTranslate(t, 'toast.doctorAdded', 'Doctor added successfully')),
  doctorRemoved: (t: any) => toast.success(safeTranslate(t, 'toast.doctorRemoved', 'Doctor removed successfully')),
  staffCreated: (t: any) => toast.success(safeTranslate(t, 'toast.staffCreated', 'Staff member added successfully')),
  staffRemoved: (t: any) => toast.success(safeTranslate(t, 'toast.staffRemoved', 'Staff member removed successfully')),
  error: (t: any, msg?: string) => {
    try {
      toast.error(msg || t('common.error') || 'Operation failed');
    } catch (e) {
      toast.error(msg || 'Operation failed');
    }
  },
};
