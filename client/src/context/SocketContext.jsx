/**
 * SocketContext.jsx
 *
 * Provides a global Socket.IO socket instance via React Context.
 *
 * FEATURE FLAG:
 * Connection is gated on VITE_SOCKET_IO_ENABLED (see client/.env).
 * - "false"  → Vercel serverless deployment; connection is skipped; socket = null.
 * - "true"   → Future hosting with WebSocket support; normal connection established.
 *
 * When the socket is null, all consumer components guard with:
 *   if (!socket) return;
 * so there are no uncaught errors on the disabled path.
 *
 * TO RE-ENABLE:
 * Set VITE_SOCKET_IO_ENABLED=true in your hosting env vars dashboard and redeploy.
 * No code changes required.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

// Read the feature flag at module load time (Vite replaces import.meta.env at build time).
const SOCKET_IO_ENABLED = import.meta.env.VITE_SOCKET_IO_ENABLED === "true";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const userId = myProfile?._id;
  const REACT_APP_SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;

  useEffect(() => {
    if (!userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // ── Feature Flag Check ────────────────────────────────────────────────────
    // Skip Socket.IO connection when the flag is disabled (current: Vercel serverless).
    // The modal is handled by components via useSocketAvailability() — not here.
    // TO REMOVE: delete this block when migrating to WebSocket-compatible hosting.
    if (!SOCKET_IO_ENABLED) {
      console.info(
        "[Socket.IO] Connection skipped — VITE_SOCKET_IO_ENABLED is false. " +
        "Set it to true when migrating to WebSocket-compatible hosting."
      );
      return;
    }

    const newsocket = io(REACT_APP_SERVER_BASE_URL, { autoConnect: true });
    newsocket.emit("join", userId);
    setSocket(newsocket);

    return () => {
      newsocket.disconnect();
    };
  }, [userId, REACT_APP_SERVER_BASE_URL]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
