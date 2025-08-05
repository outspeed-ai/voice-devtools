import { useState } from "react";
import { Link, Outlet } from "react-router";

import GetApiKeyButton from "@/components/GetApiKeyButton";
import NavLinkItem from "@/components/NavLinkItem";
import Button from "@/components/ui/Button";

import { useUpdateCheck } from "@/utils/update-check";
import { version as consoleVersion } from "@src/../package.json";

import logo from "/outspeed-logo.png";

export default function RootLayout() {
  const { data: updateInfo } = useUpdateCheck(consoleVersion);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="h-full flex flex-col">
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center bg-[var(--color-bg)] z-50">
        <div className="flex items-center justify-between w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <Link to="/" className="inline-flex items-center gap-2">
            <img style={{ width: "24px" }} src={logo} />
            <h1 className="text-lg">
              Outspeed Voice DevTools
              <span className="ml-2 bg-gray-800 text-white p-1 rounded text-xs">v{consoleVersion}</span>
            </h1>
          </Link>

          <div className="flex gap-4 items-center">
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-4 items-center">
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
              <a href="https://dashboard.outspeed.ai" target="_blank">
                Get API key
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-4 right-4 rounded-md bg-white border-b border-gray-200 shadow-lg md:hidden">
            <div className="px-4 py-2 space-y-2">
              <div className="py-2">
                <GetApiKeyButton className="w-full" />
              </div>
              {updateInfo?.hasUpdate && (
                <div className="py-2">
                  <Button
                    variant="outline"
                    className="w-full bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 text-xs py-1"
                    onClick={() => window.open("https://github.com/outspeed-ai/voice-devtools", "_blank")}
                  >
                    Update Available: v{updateInfo.version}
                  </Button>
                </div>
              )}
              <div className="py-2">
                <NavLinkItem to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  Try Demo
                </NavLinkItem>
              </div>

              <div className="py-2">
                <NavLinkItem to="/deploy" onClick={() => setIsMobileMenuOpen(false)}>
                  Deploy
                </NavLinkItem>
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="pt-16 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
