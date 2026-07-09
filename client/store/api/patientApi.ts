import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const patientApi = createApi({
  reducerPath: "patientApi",
  baseQuery: baseQuery,
  tagTypes: [
    "Dashboard",
    "Records",
    "RecordDetail",
    "Appointments",
    "Family",
    "FamilyMembers",
    "FamilyRecords",
    "Profile",
    "Connections",
    "FollowUps",
    "Doctors",
    "HealthScore",
    "ClinicReviews",
    "ClinicReviewSummary",
  ],
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => "/patient/dashboard",
      providesTags: ["Dashboard"],
    }),

    getSpentHistory: builder.query({
      query: (params: { page?: number; limit?: number } = {}) => ({
        url: "/patient/spent-history",
        params,
      }),
      providesTags: ["Dashboard"],
    }),

    getRecords: builder.query({
      query: (params: { limit?: number } = {}) => ({
        url: "/patient/records",
        params,
      }),
      providesTags: ["Records"],
    }),

    getRecordDetail: builder.query({
      query: (id: string) => `/patient/records/${id}`,
      providesTags: ["RecordDetail"],
    }),

    uploadRecord: builder.mutation({
      query: (data: any) => ({
        url: "/patient/records/upload",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Records", "Dashboard"],
    }),

    deleteRecord: builder.mutation({
      query: (id: string) => ({
        url: `/patient/records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Records"],
    }),

    getAppointments: builder.query({
      query: (view = "all") => `/patient/appointments?view=${view}`,
      providesTags: ["Appointments"],
    }),

    bookAppointment: builder.mutation({
      query: (data: any) => ({
        url: "/patient/appointments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Appointments", "Dashboard"],
    }),

    reserveSlot: builder.mutation({
      query: (data: any) => ({
        url: "/patient/appointments/reserve-slot",
        method: "POST",
        body: data,
      }),
    }),

    getAvailableSlots: builder.query({
      query: ({ doctorId, date }: { doctorId: string; date: string }) =>
        `/patient/appointments/available-slots?doctorId=${doctorId}&date=${date}`,
    }),

    cancelAppointment: builder.mutation({
      query: (id: string) => ({
        url: `/patient/appointments/${id}/cancel`,
        method: "PUT",
      }),
      invalidatesTags: ["Appointments", "Dashboard"],
    }),
    deleteAppointment: builder.mutation({
      query: (id: string) => ({
        url: `/patient/appointments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments", "Dashboard"],
    }),

    rateAppointment: builder.mutation({
      query: ({ id, score, comment }: { id: string; score: number; comment?: string }) => ({
        url: `/patient/appointments/${id}/rate`,
        method: "PUT",
        body: { score, comment },
      }),
      invalidatesTags: ["Appointments", "Dashboard"],
    }),

    submitReview: builder.mutation({
      query: (data: { doctorId: string; appointmentId: string; rating: number; comment?: string }) => ({
        url: "/patient/reviews",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Appointments", "Dashboard"],
    }),
    updateReview: builder.mutation({
      query: ({ id, ...data }: { id: string; rating: number; comment?: string }) => ({
        url: `/patient/reviews/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Appointments", "Dashboard"],
    }),

    getFamilyMembers: builder.query({
      query: () => "/patient/family",
      providesTags: ["Family", "FamilyMembers"],
    }),

    addFamilyMember: builder.mutation({
      query: (data: any) => ({
        url: "/patient/family",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Family", "FamilyMembers"],
    }),

    editFamilyMember: builder.mutation({
      query: ({ id, ...data }: any) => ({
        url: `/patient/family/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Family", "FamilyMembers"],
    }),

    deleteFamilyMember: builder.mutation({
      query: (id: string) => ({
        url: `/patient/family/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Family", "FamilyMembers"],
    }),

    getFamilyRecords: builder.query({
      query: (memberId: string) => `/patient/family/${memberId}/records`,
      providesTags: ["FamilyRecords"],
    }),

    addFamilyRecord: builder.mutation({
      query: ({ memberId, ...data }: any) => ({
        url: `/patient/family/${memberId}/records`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FamilyRecords", "Records", "Dashboard"],
    }),

    deleteFamilyRecord: builder.mutation({
      query: ({ memberId, recordId }: { memberId: string; recordId: string }) => ({
        url: `/patient/family/${memberId}/records/${recordId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FamilyRecords", "Records", "Dashboard"],
    }),

    getProfile: builder.query({
      query: () => "/patient/profile",
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation({
      query: (data: any) => ({
        url: "/patient/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    updatePassword: builder.mutation({
      query: (data: any) => ({
        url: "/patient/profile/password",
        method: "PUT",
        body: data,
      }),
    }),

    chatWithAi: builder.mutation({
      query: (data: any) => ({
        url: "/ai/groq/chat",
        method: "POST",
        body: data,
      }),
    }),

    getClinics: builder.query({
      query: () => "/patient/clinics",
      keepUnusedDataFor: 30,
    }),
    getDoctors: builder.query({
      query: (params) => ({
        url: "/patient/doctors",
        params,
      }),
      keepUnusedDataFor: 30,
      providesTags: ["Doctors"],
    }),

    // Public Discovery
    getPublicDoctors: builder.query({
      query: (params) => ({
        url: "/public/doctors",
        params,
      }),
      keepUnusedDataFor: 30,
    }),
    getPublicDoctorById: builder.query({
      query: (id) => `/public/doctors/${id}`,
    }),
    getPublicClinicById: builder.query({
      query: (id) => `/public/clinic/${id}`,
    }),
    getPublicDoctorReviews: builder.query({
      query: (id) => `/public/doctors/${id}/reviews`,
    }),
    getConnectionRequests: builder.query({
      query: () => "/patient/connections/requests",
      providesTags: ["Connections"],
    }),
    handleConnectionRequest: builder.mutation({
      query: ({ id, status }: { id: string; status: "approved" | "rejected" }) => ({
        url: `/patient/connections/requests/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Connections", "Dashboard", "Appointments"],
    }),
    getFollowUps: builder.query({
      query: (params: { status: "upcoming" | "past" | "all" }) => ({
        url: "/patient/follow-ups",
        params,
      }),
      providesTags: ["FollowUps"],
    }),
    completeFollowUp: builder.mutation({
      query: (id: string) => ({
        url: `/patient/follow-ups/${id}/complete`,
        method: "PUT",
      }),
      invalidatesTags: ["FollowUps", "HealthScore"],
    }),
    getHealthScore: builder.query({
      query: (patientId: string) => `/patient/${patientId}/health-score`,
      providesTags: (result, error, patientId) => [{ type: "HealthScore", id: patientId }],
    }),

    submitClinicReview: builder.mutation({
      query: (data: any) => ({
        url: "/patient/clinic-reviews",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "ClinicReviews", id: arg.clinicId },
        { type: "ClinicReviewSummary", id: arg.clinicId },
        "Appointments",
        "Dashboard",
      ],
    }),

    updateClinicReview: builder.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({
        url: `/patient/clinic-reviews/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "ClinicReviews", id: arg.clinicId },
        { type: "ClinicReviewSummary", id: arg.clinicId },
        "Appointments",
        "Dashboard",
      ],
    }),

    deleteClinicReview: builder.mutation({
      query: ({ id, clinicId }: { id: string; clinicId: string }) => ({
        url: `/patient/clinic-reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "ClinicReviews", id: arg.clinicId },
        { type: "ClinicReviewSummary", id: arg.clinicId },
        "Appointments",
        "Dashboard",
      ],
    }),

    getMyClinicReview: builder.query({
      query: (clinicId: string) => `/patient/clinic-reviews/my?clinicId=${clinicId}`,
      providesTags: ["ClinicReviews"],
    }),

    getClinicReviews: builder.query({
      query: ({ clinicId, ...params }: { clinicId: string; [key: string]: any }) => ({
        url: `/public/clinic/${clinicId}/reviews`,
        params,
      }),
      providesTags: (result, error, { clinicId }) => [{ type: "ClinicReviews", id: clinicId }],
    }),

    getClinicReviewSummary: builder.query({
      query: (clinicId: string) => `/public/clinic/${clinicId}/reviews/summary`,
      providesTags: (result, error, clinicId) => [{ type: "ClinicReviewSummary", id: clinicId }],
      keepUnusedDataFor: 300, // 5 minutes cache as specified
    }),

    voteReviewHelpful: builder.mutation({
      query: ({ reviewId, vote }: { reviewId: string; vote: "helpful" | "not-helpful" }) => ({
        url: `/patient/clinic-reviews/${reviewId}/helpful`,
        method: "POST",
        body: { vote },
      }),
      invalidatesTags: ["ClinicReviews"],
    }),

    flagReview: builder.mutation({
      query: ({ reviewId, reason }: { reviewId: string; reason: string }) => ({
        url: `/patient/clinic-reviews/${reviewId}/flag`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["ClinicReviews"],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetSpentHistoryQuery,
  useGetRecordsQuery,
  useGetRecordDetailQuery,
  useUploadRecordMutation,
  useDeleteRecordMutation,
  useGetAppointmentsQuery,
  useBookAppointmentMutation,
  useReserveSlotMutation,
  useGetAvailableSlotsQuery,
  useCancelAppointmentMutation,
  useDeleteAppointmentMutation,
  useRateAppointmentMutation,
  useSubmitReviewMutation,
  useUpdateReviewMutation,
  useGetFamilyMembersQuery,
  useAddFamilyMemberMutation,
  useEditFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useGetFamilyRecordsQuery,
  useAddFamilyRecordMutation,
  useDeleteFamilyRecordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useChatWithAiMutation,
  useGetClinicsQuery,
  useGetDoctorsQuery,
  useGetPublicDoctorsQuery,
  useGetPublicDoctorByIdQuery,
  useGetPublicClinicByIdQuery,
  useGetPublicDoctorReviewsQuery,
  useGetConnectionRequestsQuery,
  useHandleConnectionRequestMutation,
  useGetFollowUpsQuery,
  useCompleteFollowUpMutation,
  useGetHealthScoreQuery,
  useSubmitClinicReviewMutation,
  useUpdateClinicReviewMutation,
  useDeleteClinicReviewMutation,
  useGetMyClinicReviewQuery,
  useGetClinicReviewsQuery,
  useGetClinicReviewSummaryQuery,
  useVoteReviewHelpfulMutation,
  useFlagReviewMutation,
} = patientApi;
