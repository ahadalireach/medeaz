import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: {
    _id: string;
    email: string;
    role: string;
    isVerified: boolean;
  } | null;
  accessToken: string | null;
}

const loadFromStorage = (): AuthState => {
  if (typeof window === "undefined") return { user: null, accessToken: null };
  try {
    const user = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");
    return {
      user: user ? JSON.parse(user) : null,
      accessToken: accessToken || null,
    };
  } catch {
    return { user: null, accessToken: null };
  }
};

const initialState: AuthState = loadFromStorage();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthState["user"]; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
