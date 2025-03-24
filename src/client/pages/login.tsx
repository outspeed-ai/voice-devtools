import { useState } from "react";
import { toast } from "sonner";

import { env } from "@/config/env";
import { getSupabase } from "@/config/supabase";
import { Navigate } from "react-router";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const supabase = getSupabase();

  if (!env.OUTSPEED_HOSTED) {
    return <Navigate to="/" />;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase client not found");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      // Successful login will trigger the onAuthStateChange listener in AuthProvider
    } catch (err) {
      console.error("Login with Google error:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase client not found");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      // Successful login will trigger the onAuthStateChange listener in AuthProvider
    } catch (err) {
      console.error("Login with GitHub error:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to sign in with GitHub. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/outspeed-logo.png" alt="Outspeed Logo" className="h-12 w-auto" />
          </div>

          <h1 className="text-4xl font-extrabold text-white sm:text-5xl tracking-tight">Outspeed</h1>
          <p className="mt-4 text-xl text-blue-100/80 sm:mt-5">Sign in to access demo</p>
        </div>

        <div className="mt-6 grid gap-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-white/20 rounded-lg shadow-lg text-base font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" width="24" height="24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-white/20 rounded-lg shadow-lg text-base font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      </div>

      <p className="text-center mt-8 text-sm text-blue-100/70">
        By signing in, you agree to our{" "}
        <a
          href="https://outspeed.com/terms-of-use"
          target="_blank"
          className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200 underline-offset-2 hover:underline"
        >
          Terms of use
        </a>{" "}
        and{" "}
        <a
          href="https://outspeed.com/privacy-policy"
          target="_blank"
          className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200 underline-offset-2 hover:underline"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
