import { Key } from "react-feather";
import { Link, NavLink, Outlet } from "react-router";

import Button from "@/components/ui/Button";
import { useUpdateCheck } from "@/utils/update-check";
import { version as consoleVersion } from "@src/../package.json";

import logo from "/outspeed-logo.png";

export default function RootLayout() {
  const { data: updateInfo } = useUpdateCheck(consoleVersion);

  return (
    <div className="h-full flex flex-col">
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center bg-[var(--color-bg)]">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <Link to="/" className="inline-flex items-center gap-2">
            <img style={{ width: "24px" }} src={logo} />
            <h1>
              <span className="font-semibold">Outspeed Voice DevTools 🏎️ </span>
              <span className="bg-gray-800 text-white p-1 rounded text-xs">v{consoleVersion}</span>
            </h1>
          </Link>

          <div className="ml-auto flex gap-4 items-center">
            <Button
              className="bg-blue-500 hover:bg-blue-600 transition-colors"
              icon={<Key className="w-4 h-4" />}
              onClick={() => window.open("https://cal.com/outspeed/early-access", "_blank")}
            >
              Get API Key
            </Button>
            {updateInfo?.hasUpdate && (
              <Button
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs py-1"
                onClick={() => window.open("https://github.com/outspeed-ai/voice-devtools", "_blank")}
              >
                Update Available: v{updateInfo.version}
              </Button>
            )}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-blue-600 hover:text-blue-800 ${isActive ? "font-medium border-b-2 border-blue-600" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/sessions"
              className={({ isActive }) =>
                `text-blue-600 hover:text-blue-800 ${isActive ? "font-medium border-b-2 border-blue-600" : ""}`
              }
            >
              History
            </NavLink>
            <NavLink
              to="/deploy"
              className={({ isActive }) =>
                `text-blue-600 hover:text-blue-800 ${isActive ? "font-medium border-b-2 border-blue-600" : ""}`
              }
            >
              Deploy
            </NavLink>
          </div>
        </div>
      </nav>
      <div className="pt-16 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
