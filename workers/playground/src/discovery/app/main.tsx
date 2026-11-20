import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";

import "../../shared/styles.css";
import "virtual:discovery-code-theme.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
