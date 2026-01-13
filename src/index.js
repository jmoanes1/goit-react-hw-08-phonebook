// Code for redux //

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./redux/store";
import "./App.css";

// Suppress WebSocket connection errors from HMR (Hot Module Replacement)
// These are harmless development-only errors from webpack-dev-server
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out WebSocket connection errors from HMR
    const message = args[0]?.toString() || '';
    if (
      message.includes('WebSocket connection to') &&
      message.includes('failed')
    ) {
      // Silently ignore WebSocket HMR connection errors
      return;
    }
    // Log all other errors normally
    originalError.apply(console, args);
  };
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// end of redux code //


//... This Code without Redux:...//

// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
