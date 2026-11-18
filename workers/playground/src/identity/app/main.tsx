import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import * as TempoIdSignIn from "./tempo-id.js";

import "./styles.css";
import "virtual:identity-code-theme.css";

// A Tempo ID sign-in returns its popup here: hand the code to the opener instead of rendering.
if (!TempoIdSignIn.handleReturn())
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
