import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

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

    // Skip Socket.IO connection in serverless Vercel deployments (ephemeral & stateless)
    if (REACT_APP_SERVER_BASE_URL && REACT_APP_SERVER_BASE_URL.includes("vercel.app")) {
      console.warn("[Socket.IO] Client connection skipped — Socket.IO is disabled on serverless Vercel deployments.");
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
