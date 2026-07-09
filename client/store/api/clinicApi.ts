import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { expireSession } from "@/lib/authSession";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
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

  const requestUrl = typeof args === "string" ? args : (args as FetchArgs).url ?? "";
  const isAuthRoute = requestUrl.startsWith("/auth/");

  if (result.error && result.error.status === 401 && !isAuthRoute) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as {
          success: boolean;
          accessToken: string;
        };
        localStorage.setItem("accessToken", data.accessToken);
        result = await baseQuery(args, api, extraOptions);
        if (result.error && result.error.status === 401) {
          expireSession();
        }
      } else {
        expireSession();
      }
    } else {
      expireSession();
    }
  }

  // Normalize error messages
  if (result.error) {
    const error = result.error as any;

    if (error.status === "FETCH_ERROR") {
      return {
        error: {
          ...error,
          data: {
            message: "Network error. Please check your connection and try again.",
          },
        },
      };
    }

    if (error.status === "PARSING_ERROR") {
      return {
        error: {
          ...error,
          data: {
            message: "Server error. Please try again later.",
          },
        },
      };
    }

    if (error.status === "TIMEOUT_ERROR") {
      return {
        error: {
          ...error,
          data: {
            message: "Request timeout. Please try again.",
          },
        },
      };
    }

    if (!error.data?.message && error.status) {
      return {
        error: {
          ...error,
          data: {
            ...error.data,
            message: `Request failed with status ${error.status}`,
          },
        },
      };
    }
  }

  return result;
};

export const clinicApi = createApi({
  reducerPath: "clinicApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Overview",
    "Analytics",
    "Doctors",
    "DoctorStats",
    "Appointments",
    "Settings",
    "Staff",
    "PatientSearch",
    "Patients",
    "PatientProfile",
    "ClinicAppointmentDetail",
    "Prescriptions",
    "OPDQueue",
    "ConnectionRequests",
    "Performance",
    "AdminReviews",
    "ReviewAnalytics",
  ],
  endpoints: (builder) => ({
    getOverview: builder.query({
      query: () => "/clinic/analytics/overview",
      providesTags: ["Overview"],
    }),
    getPerformanceLeaderboard: builder.query({
      query: (period = "month") => `/clinic/performance?period=${period}`,
      providesTags: ["Performance"],
    }),
    getDoctorPerformanceDetail: builder.query({
      query: ({ doctorId, period = "month" }) =>
        `/clinic/performance/${doctorId}?period=${period}`,
      providesTags: (result, error, arg) => [
        { type: "Performance", id: arg.doctorId },
      ],
    }),
    getPatientFlow: builder.query({
      query: () => "/clinic/analytics/patient-flow",
      providesTags: ["Analytics"],
    }),
    getRevenue: builder.query({
      query: (period = "week") => `/clinic/analytics/revenue?period=${period}`,
      providesTags: ["Analytics"],
    }),
    getRevenueHistory: builder.query({
      query: (params = { page: 1, limit: 20 }) => ({
        url: '/clinic/analytics/revenue/history',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    deleteRevenueHistoryRecord: builder.mutation({
      query: (id: string) => ({
        url: `/clinic/analytics/revenue/history/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Analytics', 'Overview'],
    }),
    clearRevenueHistory: builder.mutation<void, void>({
      query: () => ({
        url: '/clinic/analytics/revenue/history',
        method: 'DELETE',
      }),
      invalidatesTags: ['Analytics', 'Overview'],
    }),

    getDoctors: builder.query({
      query: (params) => ({
        url: "/clinic/doctors",
        params,
      }),
      providesTags: ["Doctors"],
    }),
    addDoctor: builder.mutation({
      query: (body) => ({
        url: "/clinic/doctors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Doctors", "Overview"],
    }),
    removeDoctor: builder.mutation({
      query: (id) => ({
        url: `/clinic/doctors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Doctors", "Overview"],
    }),
    getDoctorStats: builder.query({
      query: ({ doctorId, period }) => `/clinic/doctors/${doctorId}/stats?period=${period}`,
      providesTags: (result, error, arg) => [{ type: "DoctorStats", id: arg.doctorId }],
    }),
    searchDoctorByEmail: builder.query({
      query: (email) => ({
        url: "/clinic/doctors/search",
        params: { email },
      }),
      keepUnusedDataFor: 30,
      providesTags: ["Doctors", "ConnectionRequests"],
    }),
    sendConnectionRequest: builder.mutation({
      query: (body) => ({
        url: "/clinic/connection-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ConnectionRequests", "Doctors"],
    }),
    getSentConnectionRequests: builder.query({
      query: () => "/clinic/connection-requests",
      providesTags: ["ConnectionRequests"],
    }),
    cancelConnectionRequest: builder.mutation({
      query: (requestId) => ({
        url: `/clinic/connection-requests/${requestId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ConnectionRequests", "Doctors"],
    }),
    overrideAvailability: builder.mutation({
      query: ({ doctorId, status }) => ({
        url: `/clinic/doctors/${doctorId}/availability`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Doctors"],
    }),

    getAppointments: builder.query({
      query: (params) => ({
        url: "/clinic/appointments",
        params,
      }),
      providesTags: ["Appointments"],
    }),

    getAppointmentById: builder.query({
      query: (id: string) => `/clinic/appointments/${id}`,
      providesTags: ["ClinicAppointmentDetail"],
    }),

    getPrescriptions: builder.query({
      query: (params) => ({
        url: "/clinic/prescriptions",
        params,
      }),
      providesTags: ["Prescriptions"],
    }),
    deleteAppointment: builder.mutation({
      query: (id: string) => ({
        url: `/clinic/appointments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments", "Overview"],
    }),
    createAppointment: builder.mutation({
      query: (body) => ({
        url: "/clinic/appointments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments", "Overview"],
    }),
    deletePrescription: builder.mutation({
      query: (id: string) => ({
        url: `/clinic/prescriptions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Prescriptions", "Overview"],
    }),

    getSettings: builder.query({
      query: () => "/clinic/settings",
      providesTags: ["Settings"],
    }),
    saveSettings: builder.mutation({
      query: (body) => ({
        url: "/clinic/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings", "Overview"],
    }),

    getStaff: builder.query({
      query: () => "/clinic/staff",
      providesTags: ["Staff"],
    }),
    addStaff: builder.mutation({
      query: (body) => ({
        url: "/clinic/staff",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    editStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/clinic/staff/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/clinic/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),

    getPatients: builder.query({
      query: (params) => ({
        url: "/clinic/patients",
        params,
      }),
      providesTags: ["Patients"],
    }),

    searchPatients: builder.query({
      query: ({ q, page, limit }) => ({
        url: "/clinic/patients/search",
        params: { q, page, limit },
      }),
      keepUnusedDataFor: 30,
      providesTags: ["PatientSearch"],
    }),
    getPatientProfile: builder.query({
      query: (id) => `/clinic/patients/${id}`,
      providesTags: ["PatientProfile"],
    }),
    deleteRecord: builder.mutation({
      query: (id: string) => ({
        url: `/clinic/patients/records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PatientProfile"],
    }),
    createPatient: builder.mutation({
      query: (body) => ({
        url: "/clinic/patients",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Patients", "Overview"],
    }),
    getOPDQueue: builder.query({
      query: (params) => ({
        url: "/opd-queue",
        params,
      }),
      providesTags: ["OPDQueue"],
    }),
    issueToken: builder.mutation({
      query: (body) => ({
        url: "/opd-queue",
        method: "POST",
        body,
      }),
      invalidatesTags: ["OPDQueue"],
    }),
    callToken: builder.mutation({
      query: ({ tokenId }) => ({
        url: `/opd-queue/${tokenId}/call`,
        method: "PUT",
      }),
      async onQueryStarted({ tokenId, filterParams }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          clinicApi.util.updateQueryData("getOPDQueue" as any, filterParams, (draft: any) => {
            if (draft && draft.data && draft.data.tokens) {
              const token = draft.data.tokens.find((t: any) => t._id === tokenId);
              if (token) {
                token.status = "called";
                token.calledAt = new Date().toISOString();
              }
            }
          })
         );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["OPDQueue"],
    }),
    completeToken: builder.mutation({
      query: ({ tokenId }) => ({
        url: `/opd-queue/${tokenId}/complete`,
        method: "PUT",
      }),
      async onQueryStarted({ tokenId, filterParams }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          clinicApi.util.updateQueryData("getOPDQueue" as any, filterParams, (draft: any) => {
            if (draft && draft.data && draft.data.tokens) {
              const token = draft.data.tokens.find((t: any) => t._id === tokenId);
              if (token) {
                token.status = "completed";
                token.completedAt = new Date().toISOString();
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["OPDQueue"],
    }),
    skipToken: builder.mutation({
      query: ({ tokenId }) => ({
        url: `/opd-queue/${tokenId}/skip`,
        method: "PUT",
      }),
      async onQueryStarted({ tokenId, filterParams }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          clinicApi.util.updateQueryData("getOPDQueue" as any, filterParams, (draft: any) => {
            if (draft && draft.data && draft.data.tokens) {
              const token = draft.data.tokens.find((t: any) => t._id === tokenId);
              if (token) {
                token.status = "skipped";
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["OPDQueue"],
    }),
    getClinicAdminReviews: builder.query({
      query: (params) => ({
        url: "/clinic/reviews",
        params,
      }),
      providesTags: ["AdminReviews"],
    }),
    respondToReview: builder.mutation({
      query: ({ reviewId, text }) => ({
        url: `/clinic/reviews/${reviewId}/respond`,
        method: "PUT",
        body: { text },
      }),
      invalidatesTags: ["AdminReviews", "ReviewAnalytics"],
    }),
    updateReviewStatus: builder.mutation({
      query: ({ reviewId, status, dismissFlags }) => ({
        url: `/clinic/reviews/${reviewId}/status`,
        method: "PUT",
        body: { status, dismissFlags },
      }),
      invalidatesTags: ["AdminReviews", "ReviewAnalytics"],
    }),
    getReviewAnalytics: builder.query({
      query: () => "/clinic/reviews/analytics",
      providesTags: ["ReviewAnalytics"],
    }),
    exportReviews: builder.query<string, void>({
      query: () => ({
        url: "/clinic/reviews/export",
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetPatientFlowQuery,
  useGetRevenueQuery,
  useGetRevenueHistoryQuery,
  useDeleteRevenueHistoryRecordMutation,
  useClearRevenueHistoryMutation,
  useGetDoctorsQuery,
  useAddDoctorMutation,
  useRemoveDoctorMutation,
  useGetDoctorStatsQuery,
  useSearchDoctorByEmailQuery,
  useGetAppointmentsQuery,
  useGetAppointmentByIdQuery,
  useGetPrescriptionsQuery,
  useDeleteAppointmentMutation,
  useCreateAppointmentMutation,
  useDeletePrescriptionMutation,
  useGetSettingsQuery,
  useSaveSettingsMutation,
  useGetStaffQuery,
  useAddStaffMutation,
  useEditStaffMutation,
  useDeleteStaffMutation,
  useGetPatientsQuery,
  useSearchPatientsQuery,
  useLazySearchPatientsQuery,
  useGetPatientProfileQuery,
  useDeleteRecordMutation,
  useCreatePatientMutation,
  useGetOPDQueueQuery,
  useIssueTokenMutation,
  useCallTokenMutation,
  useCompleteTokenMutation,
  useSkipTokenMutation,
  useOverrideAvailabilityMutation,
  useSendConnectionRequestMutation,
  useGetSentConnectionRequestsQuery,
  useCancelConnectionRequestMutation,
  useGetPerformanceLeaderboardQuery,
  useGetDoctorPerformanceDetailQuery,
  useGetClinicAdminReviewsQuery,
  useRespondToReviewMutation,
  useUpdateReviewStatusMutation,
  useGetReviewAnalyticsQuery,
  useLazyExportReviewsQuery,
} = clinicApi;
