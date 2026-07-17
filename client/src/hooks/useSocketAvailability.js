/**
 * useSocketAvailability.js
 *
 * Centralized hook for checking whether Socket.IO is available.
 *
 * WHY THIS EXISTS:
 * The Traveler backend is deployed on Vercel serverless, which does not support
 * persistent WebSocket connections. Socket.IO features (real-time notifications,
 * live tracking, typing indicators, real-time messaging) are therefore unavailable.
 * Rather than silently failing, we show a professional modal informing the user.
 *
 * HOW TO RE-ENABLE SOCKET.IO (future migration):
 * 1. Set VITE_SOCKET_IO_ENABLED=true in your Netlify/hosting env variables dashboard.
 * 2. Redeploy. No code changes needed — this hook and all consumers update automatically.
 *
 * SESSION BEHAVIOR:
 * The unavailability modal is shown at most ONCE per browser session. Subsequent
 * attempts in the same session are silently swallowed to avoid modal spam.
 * Refreshing the page resets the session flag.
 */

import { useCallback } from "react";

// Read the feature flag from the Vite environment.
// "true" string  → Socket.IO enabled (future hosting, e.g. Railway / Render)
// "false" string → Socket.IO disabled (current: Vercel serverless)
const SOCKET_IO_ENABLED = import.meta.env.VITE_SOCKET_IO_ENABLED === "true";

// sessionStorage key used to track whether we already showed the modal this session.
const SESSION_KEY = "socket_unavailable_shown";

/**
 * useSocketAvailability()
 *
 * @returns {{
 *   isEnabled: boolean,
 *   showUnavailableModal: () => void
 * }}
 *
 * Usage:
 *   const { isEnabled, showUnavailableModal } = useSocketAvailability();
 *   if (!isEnabled) { showUnavailableModal(); return; }
 *   socket.emit("goLive", ...);
 */
export function useSocketAvailability() {
  /**
   * showUnavailableModal
   * Dispatches a custom DOM event that SocketUnavailableModal listens for.
   * Uses sessionStorage to ensure the modal is shown at most once per session.
   *
   * TO REMOVE THIS IN FUTURE: simply delete this file and the SocketUnavailableModal
   * component, and remove all `useSocketAvailability` imports from consumers.
   */
  const showUnavailableModal = useCallback(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      // Already shown this session — don't spam the user.
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "true");

    // Dispatch a custom event so SocketUnavailableModal can listen globally.
    window.dispatchEvent(new CustomEvent("socket:unavailable"));
  }, []);

  return {
    isEnabled: SOCKET_IO_ENABLED,
    showUnavailableModal,
  };
}

export default useSocketAvailability;
