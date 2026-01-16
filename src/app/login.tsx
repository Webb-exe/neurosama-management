import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate({ to: "/" });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full mx-auto text-center space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Robotics Team Manager
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Sign in to access your team dashboard
          </p>
        </div>

        <div className="space-y-4">
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="w-full bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:opacity-90 transition">
              Sign In
            </button>
          </SignInButton>

          <p className="text-slate-500 text-sm">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
