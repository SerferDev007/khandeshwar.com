import React from "react";
import ReactDOM from "react-dom/client";
import { AppWithRouter } from "./src/AppRouter";
import { AppRoot } from "./src/components/AppRoot";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoot>
      <AppWithRouter />
    </AppRoot>
  </React.StrictMode>
);
