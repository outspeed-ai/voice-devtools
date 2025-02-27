import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import AppRouter from "./components/AppRouter";

export function render(url) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRouter />
      </StaticRouter>
    </StrictMode>,
  );
  return { html };
}
