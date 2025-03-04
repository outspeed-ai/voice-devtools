import { Route, Routes } from "react-router-dom";

import RootLayout from "./pages/_layout";
import Index from "./pages/index";
import Metrics from "./pages/metrics";
import MetricDetail from "./pages/metrics/[id]";
import Sessions from "./pages/sessions";

export default function Router() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/sessions" element={<Sessions />} />

        {/* session_id will be passed as a query param to fetch metrics by session*/}
        <Route path="/metrics/" element={<Metrics />} />
        <Route path="/metrics/:id" element={<MetricDetail />} />
      </Route>
    </Routes>
  );
}
