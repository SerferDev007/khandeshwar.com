import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import { AppWithRouter } from "./src/AppRouter"; // TODO: Enable when fully migrating to React Router
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    {/* TODO: Replace with <AppWithRouter /> when migrating from tabs to React Router */}
  </React.StrictMode>
);
