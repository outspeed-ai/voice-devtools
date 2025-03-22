import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./base.css";
import EntryCommon from "./entry-common";

ReactDOM.hydrateRoot(
  document.getElementById("root")!,
  <StrictMode>
    <BrowserRouter>
      <EntryCommon />
    </BrowserRouter>
  </StrictMode>,
);
