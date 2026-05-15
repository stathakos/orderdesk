import { useEffect } from "react";
import { refreshToken } from "../services/api";
import { getToken, getUser, login } from "../services/authStore";

// Refresh the token 30 minutes before it expires
// Token lasts 8 hours = 480 minutes
// We refresh at 7.5 hours = 450 minutes = 27,000,000 ms
const REFRESH_INTERVAL = 27 * 60 * 60 * 1000; // 7.5 hours in ms
const INITIAL_DELAY = 100; // small delay on mount

export default function useTokenRefresh() {
  useEffect(() => {
    // Don't run if not logged in
    if (!getToken()) return;

    async function doRefresh() {
      try {
        const { access_token } = await refreshToken();
        const user = getUser();
        login(access_token, user);
        console.log("✅ Token refreshed silently");
      } catch (err) {
        console.warn("Token refresh failed — user may need to log in again");
      }
    }

    // Refresh once shortly after mount (in case token is already old)
    const initialTimer = setTimeout(doRefresh, INITIAL_DELAY);

    // Then refresh every 7.5 hours
    const interval = setInterval(doRefresh, REFRESH_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
}
