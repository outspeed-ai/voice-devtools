import { Link, NavLink, Outlet } from "react-router";

import Button from "@/components/ui/Button";
import { useUpdateCheck } from "@/utils/update-check";
import { version as consoleVersion } from "@src/../package.json";

import GetApiKeyButton from "@/components/GetApiKeyButton";
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
            <GetApiKeyButton className="mx-auto" />
            {updateInfo?.hasUpdate && (
              <Button
                variant="outline"
                className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 text-xs py-1"
                onClick={() => window.open("https://github.com/outspeed-ai/voice-devtools", "_blank")}
              >
                Update Available: v{updateInfo.version}
              </Button>
            )}
            <NavLink
              to="/"
              className={({ isActive }) => `text-black ${isActive ? "font-medium border-b-2 border-teal-600" : ""}`}
            >
              Try Demo
            </NavLink>
            <NavLink
              to="/api-keys"
              className={({ isActive }) => `text-black ${isActive ? "font-medium border-b-2 border-teal-600" : ""}`}
            >
              API Keys
            </NavLink>
            <NavLink
              to="/sessions"
              className={({ isActive }) => `text-black ${isActive ? "font-medium border-b-2 border-teal-600" : ""}`}
            >
              Sessions
            </NavLink>
            <NavLink
              to="/deploy"
              className={({ isActive }) => `text-black  ${isActive ? "font-medium border-b-2 border-teal-600" : ""}`}
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
