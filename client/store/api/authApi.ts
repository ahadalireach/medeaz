import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getProfile: builder.query({
      query: () => "/auth/profile",
    }),
    verifyEmail: builder.mutation({
      query: (token) => ({
        url: `/auth/verify/${token}`,
        method: "POST",
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/auth/profile",
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
} = authApi;
