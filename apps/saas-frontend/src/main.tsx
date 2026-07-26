import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SaasAuthProvider } from "./auth/SaasAuthContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SaasAuthProvider>
        <App />
      </SaasAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
