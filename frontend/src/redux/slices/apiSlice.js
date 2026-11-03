import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import { logout } from "./authSlice";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL + "/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    // Bearer token fallback for clients where the httpOnly cookie isn't sent
    // (mobile/ITP). The cookie remains the primary mechanism when present.
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Login/verification failures are shown by the form, not treated as an expired session.
const AUTH_ENDPOINT_PATTERN =
  /\/(?:users|auth)\/(?:login|verify|register|logout)(?:[?#]|$)/;

let handlingExpiredSession = false;

async function handleExpiredSession(api, extraOptions) {
  if (handlingExpiredSession) return;
  handlingExpiredSession = true;

  const shouldRedirect = window.location.pathname !== "/log-in";

  // Clear the Redux session plus the persisted token/user snapshots.
  api.dispatch(logout());
  localStorage.removeItem("user");

  // Best-effort server logout to expire the httpOnly cookie. The local session
  // is already cleared, so a failure here must not block the redirect.
  try {
    await rawBaseQuery(
      { url: "/users/logout", method: "POST" },
      api,
      extraOptions
    );
  } catch {
    // Ignore network errors; there is nothing else to clear locally.
  }

  if (shouldRedirect) {
    // The login page reads this flag once and shows a toast.
    try {
      sessionStorage.setItem("sessionExpired", "1");
    } catch {
      // Storage can be unavailable in private modes; the redirect still matters.
    }
    // Hard redirect resets RTK Query caches and stops any polling loops.
    window.location.replace("/log-in");
  } else {
    handlingExpiredSession = false;
  }
}

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const requestUrl = typeof args === "string" ? args : args?.url || "";

  if (result.error?.status === 401 && !AUTH_ENDPOINT_PATTERN.test(requestUrl)) {
    await handleExpiredSession(api, extraOptions);
  }

  return result;
};

export const apiSlice = createApi ({
    baseQuery,
    tagTypes:['Product', 'Category', 'User','Order'],
    endpoints: () => ({}),
});