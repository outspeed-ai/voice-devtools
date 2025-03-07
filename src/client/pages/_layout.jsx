import { Link, Outlet } from "react-router-dom";

import { useModel } from "@/contexts/ApiContext";
import { OUTSPEED_PROVIDER } from "@src/session-config";

import logo from "/outspeed-logo-dark.png";

export default function RootLayout() {
  const { selectedModel } = useModel();

  return (
    <div className="h-full flex flex-col">
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center bg-[var(--color-bg)]">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>
            Outspeed Realtime Console 🏎️{" "}
            <span className="bg-gray-800 text-white p-1 rounded text-xs">
              v0.0.1
            </span>
          </h1>

          <div className="ml-auto flex gap-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
            {selectedModel.url === OUTSPEED_PROVIDER && (
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
      <div className="pt-16 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
