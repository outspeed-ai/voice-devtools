import { Link, Outlet } from "react-router-dom";

import Button from "@/components/ui/Button";
import { useModel } from "@/contexts/model";
import { useUpdateCheck } from "@/utils/update-check";
import { version as consoleVersion } from "@src/../package.json";
import { providers } from "@src/settings";

import logo from "/outspeed-logo-dark.png";

export default function RootLayout() {
  const { selectedModel } = useModel();
  const { data: updateInfo } = useUpdateCheck(consoleVersion);

  return (
    <div className="h-full flex flex-col">
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center bg-[var(--color-bg)]">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>
            <span className="font-semibold">Outspeed Realtime Console 🏎️ </span>
            <span className="bg-gray-800 text-white p-1 rounded text-xs">v{consoleVersion}</span>
          </h1>

          <div className="ml-auto flex gap-4 items-center">
            {updateInfo?.hasUpdate && (
              <Button
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs py-1"
                onClick={() => window.open("https://github.com/outspeed-ai/realtime-console", "_blank")}
              >
                Update Available: v{updateInfo.version}
              </Button>
            )}
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
            {selectedModel.provider === providers.Outspeed && (
              <Link to="/sessions" className="text-blue-600 hover:text-blue-800">
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
