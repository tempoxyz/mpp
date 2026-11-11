import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";

import "./styles.css";
import "virtual:session-code-theme.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
