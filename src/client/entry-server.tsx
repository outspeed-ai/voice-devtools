import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import EntryCommon from "./entry-common";

export function render(url: string) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <EntryCommon />
      </StaticRouter>
    </StrictMode>,
  );

  return { html };
}
