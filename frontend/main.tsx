import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppRoot } from "./src/components/AppRoot";
// import { AppWithRouter } from "./src/AppRouter"; // TODO: Enable when fully migrating to React Router
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoot>
      <App />
    </AppRoot>
    {/* TODO: Replace with <AppWithRouter /> when migrating from tabs to React Router */}
  </React.StrictMode>
);
