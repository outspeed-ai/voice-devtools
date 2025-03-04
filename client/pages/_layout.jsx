import { Link, Outlet } from "react-router-dom";

import { useApi } from "@/contexts/ApiContext";

import logo from "/assets/logo-dark.png";

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
        <Outlet />
      </div>
    </>
  );
};

export default AppRouter;
