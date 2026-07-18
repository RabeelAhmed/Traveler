import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'
import * as ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import App from './App.jsx'
import { Provider } from 'react-redux'
import { BrowserRouter } from "react-router-dom";
import store from './Toolkit/store.js';
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <HelmetProvider>
      <Provider store={store} >
        <Toaster position="top-center" reverseOrder={false} />
        <SocketProvider>
          <App />
        </SocketProvider>
      </Provider>
    </HelmetProvider>
  </BrowserRouter>
);
