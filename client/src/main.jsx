import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'
import * as ReactDOM from "react-dom";
import { MotionConfig } from "framer-motion";
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx';
import { Provider } from 'react-redux';
import store from './Toolkit/store.js';
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";

createRoot(document.getElementById('root')).render(
  
  <MotionConfig reducedMotion="user"><BrowserRouter>
  <Provider store={store} >
  <Toaster position="top-center" reverseOrder={false} />
    <SocketProvider>
      <App />
    </SocketProvider>
    </Provider>
  </BrowserRouter></MotionConfig>
);
