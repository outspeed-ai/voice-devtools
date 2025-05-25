import { Link, Outlet } from "react-router";

import GetApiKeyButton from "@/components/GetApiKeyButton";
import NavLinkItem from "@/components/NavLinkItem";
import Button from "@/components/ui/Button";
import { useUpdateCheck } from "@/utils/update-check";
import { version as consoleVersion } from "@src/../package.json";

import { env } from "@/config/env";
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
              <span className="font-semibold inline-flex items-center">
                {env.OUTSPEED_HOSTED ? "Outspeed" : "Outspeed Voice DevTools"}
              </span>

              {!env.OUTSPEED_HOSTED && (
                <span className="ml-2 bg-gray-800 text-white p-1 rounded text-xs">v{consoleVersion}</span>
              )}
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
            <NavLinkItem to="/">Try Demo</NavLinkItem>
            <NavLinkItem to="/api-keys">API Keys</NavLinkItem>
            <NavLinkItem to="/sessions">Sessions</NavLinkItem>
            <NavLinkItem to="/deploy">Deploy</NavLinkItem>
          </div>
        </div>
      </nav>
      <div className="pt-16 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
