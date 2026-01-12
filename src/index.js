// Code for redux //

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
// Import axios configuration early to set up interceptors and ensure HTTPS
import "./utils/axiosConfig";
import App from "./App";
import { store } from "./redux/store";
import "./App.css";

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
