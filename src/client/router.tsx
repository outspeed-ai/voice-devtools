import { Route, Routes } from "react-router";

import { ProtectedRoutes, StrictlyPublicRoutes } from "./components/route-protection";
import { env } from "./config/env";
import RootLayout from "./pages/_layout";
import Index from "./pages/index";
import Login from "./pages/login";
import Sessions from "./pages/sessions";

export default function Router() {
  return (
    <Routes>
      {/* protected routes */}
      <Route element={<ProtectedRoutes redirectTo="/login" optional={!env.OUTSPEED_HOSTED} />}>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/sessions" element={<Sessions />} />
        </Route>
      </Route>

      {/* strictly public routes */}
      <Route element={<StrictlyPublicRoutes redirectTo="/" optional={!env.OUTSPEED_HOSTED} />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="*" element={<p>Not Found</p>} />
    </Routes>
  );
}
