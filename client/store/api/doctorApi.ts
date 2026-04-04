import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to get a new token
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        // Store the new token
        const data = refreshResult.data as { success: boolean; accessToken: string };
        localStorage.setItem('accessToken', data.accessToken);
        
        // Retry the original query with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed - logout user
        localStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else {
      // No refresh token - logout user
      localStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const doctorApi = createApi({
  reducerPath: 'doctorApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Patients', 'Prescriptions', 'Appointments', 'Schedule'],
  endpoints: (builder) => ({
    // Patients
    getPatients: builder.query({
      query: (params) => ({
        url: '/doctor/patients',
        params,
      }),
      providesTags: ['Patients'],
    }),
    getPatientById: builder.query({
      query: (id) => `/doctor/patients/${id}`,
      providesTags: ['Patients'],
    }),
    createPatient: builder.mutation({
      query: (body) => ({
        url: '/doctor/patients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Patients'],
    }),
    deletePatient: builder.mutation({
      query: (id) => ({
        url: `/doctor/patients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Patients'],
    }),
    
    // Prescriptions
    getPrescriptions: builder.query({
      query: (params) => ({
        url: '/doctor/prescriptions',
        params,
      }),
      providesTags: ['Prescriptions'],
    }),
    getPrescriptionById: builder.query({
      query: (id) => `/doctor/prescriptions/${id}`,
      providesTags: ['Prescriptions'],
    }),
    createPrescription: builder.mutation({
      query: (body) => ({
        url: '/doctor/prescriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Prescriptions'],
    }),
    updatePrescription: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/doctor/prescriptions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Prescriptions'],
    }),
    deletePrescription: builder.mutation({
      query: (id) => ({
        url: `/doctor/prescriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Prescriptions'],
    }),
    
    // Appointments
    getAppointments: builder.query({
      query: (params) => ({
        url: '/doctor/appointments',
        params,
      }),
      providesTags: ['Appointments'],
    }),
    getTodayQueue: builder.query({
      query: () => '/doctor/appointments/today',
      providesTags: ['Appointments'],
    }),
    createAppointment: builder.mutation({
      query: (body) => ({
        url: '/doctor/appointments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointments'],
    }),
    updateAppointmentStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/doctor/appointments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Appointments'],
    }),
    deleteAppointment: builder.mutation({
      query: (id) => ({
        url: `/doctor/appointments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Appointments'],
    }),
    
    // Schedule
    getSchedule: builder.query({
      query: () => '/doctor/schedule',
      providesTags: ['Schedule'],
    }),
    updateSchedule: builder.mutation({
      query: (body) => ({
        url: '/doctor/schedule',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Schedule'],
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetPatientByIdQuery,
  useCreatePatientMutation,
  useDeletePatientMutation,
  useGetPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useCreatePrescriptionMutation,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useGetAppointmentsQuery,
  useGetTodayQueueQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
  useGetScheduleQuery,
  useUpdateScheduleMutation,
} = doctorApi;

