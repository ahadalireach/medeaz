import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarCollapsed: false,
  clinicOpsOpen: false,
  doctorCopilotOpen: false,
  patientAssistantOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleClinicOps: (state) => {
      state.clinicOpsOpen = !state.clinicOpsOpen;
    },
    setClinicOpsOpen: (state, action) => {
      state.clinicOpsOpen = action.payload;
    },
    toggleDoctorCopilot: (state) => {
      state.doctorCopilotOpen = !state.doctorCopilotOpen;
    },
    setDoctorCopilotOpen: (state, action) => {
      state.doctorCopilotOpen = action.payload;
    },
    togglePatientAssistant: (state) => {
      state.patientAssistantOpen = !state.patientAssistantOpen;
    },
    setPatientAssistantOpen: (state, action) => {
      state.patientAssistantOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, toggleClinicOps, setClinicOpsOpen, toggleDoctorCopilot, setDoctorCopilotOpen, togglePatientAssistant, setPatientAssistantOpen } = uiSlice.actions;
export default uiSlice.reducer;
