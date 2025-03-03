import { Link, Route, Routes } from "react-router-dom";

import { useApi } from "@/contexts/ApiContext";
import App from "./App";
import MetricDetail from "./pages/MetricDetail";
import MetricsDashboard from "./pages/Metrics";
import SessionsDashboard from "./pages/Sessions";

import logo from "/assets/openai-logomark.svg";

const AppRouter = () => {
  const { selectedProvider } = useApi();

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center bg-[#efefef]">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>Outspeed Realtime Console 🏎️</h1>

          <div className="ml-auto flex gap-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
            {selectedProvider.features.includes("sessions") && (
              <Link
                to="/sessions"
                className="text-blue-600 hover:text-blue-800"
              >
                Sessions
              </Link>
            )}
          </div>
        </div>
      </nav>
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/sessions" element={<SessionsDashboard />} />

          {/* session_id will be passed as a query param to fetch metrics by session*/}
          <Route path="/metrics/" element={<MetricsDashboard />} />
          <Route path="/metrics/:id" element={<MetricDetail />} />
        </Routes>
      </div>
    </>
  );
};

export default AppRouter;
