import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import "./base.css";
import EntryCommon from "./entry-common";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <EntryCommon />
    </BrowserRouter>
  </StrictMode>,
);
