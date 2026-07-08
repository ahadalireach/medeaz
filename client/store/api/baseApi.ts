import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setAccessToken } from "../slices/authSlice";
import { expireSession } from "@/lib/authSession";

const baseFetchQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Fetch refresh token from localStorage
const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
};

const logoutExpiredSession = () => {
  expireSession();
};

// Custom base query with re-auth and error handling
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseFetchQuery(args, api, extraOptions);

  // Determine if the request is to a public auth endpoint (login, register, etc.)
  // These endpoints do NOT use session tokens and should never trigger expireSession().
  const requestUrl = typeof args === "string" ? args : (args as FetchArgs).url ?? "";
  const isAuthRoute = requestUrl.startsWith("/auth/") || requestUrl === "/auth/login" || requestUrl === "/auth/register";

  // If 401 error on a non-auth route, try to refresh the token
  if (result.error && result.error.status === 401 && !isAuthRoute) {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      // Try to get a new access token
      const refreshResult = await baseFetchQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { success: boolean; accessToken: string };
        // Store new token
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", data.accessToken);
        }
        api.dispatch(setAccessToken(data.accessToken));

        // Retry the original request with the new token
        result = await baseFetchQuery(args, api, extraOptions);
        if (result.error && result.error.status === 401) {
          logoutExpiredSession();
        }
      } else {
        logoutExpiredSession();
      }
    } else {
      logoutExpiredSession();
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
