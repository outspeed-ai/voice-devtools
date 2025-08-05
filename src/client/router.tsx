import { Route, Routes } from "react-router";

import RootLayout from "./pages/_layout";
import Index from "./pages/index";

export default function Router() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<p>Not Found</p>} />
      </Route>
    </Routes>
  );
}
