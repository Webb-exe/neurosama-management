import { UserButton } from "@clerk/clerk-react";
import { DesktopSidebar, MobileSidebar } from "./Sidebar";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { authStatus, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && authStatus.status === "unauthenticated") {
      navigate({ to: "/login" });
    }
  }, [isLoading, authStatus.status, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (authStatus.status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Redirecting to login...</div>
      </div>
    );
  }

  if (authStatus.status === "waitlisted") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg text-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
              You&apos;re on the Waitlist
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mt-2">
              Your request to join the team has been received.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-4">
              You&apos;ll be able to access the dashboard once an administrator
              approves your request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus.status === "not_allowed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg text-center">
          <p className="text-lg text-red-600">Registration is currently closed.</p>
          <p className="text-sm text-slate-500 mt-2">
            Please contact the team administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
          <MobileSidebar />
          <div className="flex-1" />
          <UserButton />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
