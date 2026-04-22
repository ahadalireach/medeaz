import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout, setAccessToken } from "../slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<string | null> | null = null;

const runRefresh = (
  api: Parameters<BaseQueryFn>[1],
): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const state = api.getState() as RootState;
      const refreshToken = state.auth.refreshToken;
      if (!refreshToken) return null;

      const result = await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        {},
      );

      const newToken =
        result.data && typeof result.data === "object"
          ? (result.data as { accessToken?: string }).accessToken ?? null
          : null;

      if (newToken) {
        api.dispatch(setAccessToken(newToken));
        return newToken;
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isAuthCall =
      typeof args === "object" &&
      typeof args.url === "string" &&
      (args.url.startsWith("/auth/login") ||
        args.url.startsWith("/auth/refresh") ||
        args.url.startsWith("/auth/register") ||
        args.url.startsWith("/auth/verify") ||
        args.url.startsWith("/auth/forgot-password") ||
        args.url.startsWith("/auth/reset-password"));

    if (!isAuthCall) {
      const newToken = await runRefresh(api);
      if (newToken) {
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    }
  }

  return result;
};
